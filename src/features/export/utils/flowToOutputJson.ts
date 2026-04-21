import type { Node, Edge } from '@xyflow/react';
import type { PageDescriptor, ActionElement } from '@/shared/types/store';

interface OutputValidation {
  rule: 'minLength' | 'maxLength' | 'dataType';
  value: number | string;
  description: string;
}

interface OutputFieldRef {
  id: string;
  uuid?: string;
  label: string;
}

interface OutputCondition {
  type: 'all_inputs_valid' | 'fields_match' | 'custom_rule';
  description: string;
  fields?: OutputFieldRef[];
  onMismatch?: {
    action: 'showError';
    errorMessage: string;
    displayOn?: OutputFieldRef;
  };
}

interface OutputOnSuccess {
  actionType: string;
  targetPageId: string | null;
  apiEndpoint?: string | null;
  method?: string;
  outcomes?: Array<{ outcomeKey: string; targetPageId: string }>;
  description: string;
}

interface OutputElement {
  id: string;
  uuid?: string;
  label: string;
  elementType: 'input' | 'button' | 'link';
  validations?: OutputValidation[];
  conditions?: OutputCondition[];
  onAllConditionsMet?: OutputOnSuccess;
}

interface OutputPage {
  id: string;
  uuid?: string;
  name: string;
  elements: OutputElement[];
}

export interface OutputJson {
  schemaVersion: '1.0';
  generatedAt: string;
  pages: OutputPage[];
  navigationEdges: Array<{
    from: { pageId: string; elementId: string; elementLabel: string };
    to: { pageId: string };
    edgeType: string;
    outcomeKey?: string;
  }>;
}

function describeValidation(rule: string, value: number | string): string {
  switch (rule) {
    case 'minLength':
      return `Value must be at least ${value} character${value === 1 ? '' : 's'} long`;
    case 'maxLength':
      return `Value must be at most ${value} character${value === 1 ? '' : 's'} long`;
    case 'dataType': {
      const labels: Record<string, string> = {
        numbers: 'Only numeric characters (0-9) are accepted',
        letters: 'Only alphabetic characters (a-z, A-Z) are accepted',
        alphanumeric: 'Only letters and numbers are accepted — no special characters',
        any: 'Any characters are accepted',
      };
      return labels[value as string] ?? `Input must be of type: ${value}`;
    }
    default:
      return `Rule: ${rule} = ${value}`;
  }
}

function serializeElement(
  el: ActionElement,
  pageInputElements: ActionElement[],
  pageId: string,
  edges: Edge[],
): OutputElement {
  if (el.elementType === 'input') {
    const validations: OutputValidation[] = [];
    const v = el.validations ?? {};
    if (v.minLength !== undefined) {
      validations.push({
        rule: 'minLength',
        value: v.minLength,
        description: describeValidation('minLength', v.minLength),
      });
    }
    if (v.maxLength !== undefined) {
      validations.push({
        rule: 'maxLength',
        value: v.maxLength,
        description: describeValidation('maxLength', v.maxLength),
      });
    }
    if (v.dataType && v.dataType !== 'any') {
      validations.push({
        rule: 'dataType',
        value: v.dataType,
        description: describeValidation('dataType', v.dataType),
      });
    }

    return {
      id: el.id,
      uuid: el.uuid,
      label: el.label || el.id,
      elementType: 'input',
      validations: validations.length > 0 ? validations : undefined,
    };
  }

  const conditions: OutputCondition[] = [];

  const hasAnyInputValidations = pageInputElements.some(
    (inp) => inp.validations && Object.keys(inp.validations).length > 0
  );
  const hasFieldMatches = (el.fieldMatchConditions ?? []).length > 0;

  if (hasAnyInputValidations || hasFieldMatches) {
    conditions.push({
      type: 'all_inputs_valid',
      description:
        'All input fields on this page must individually pass their validation rules (length, data type) before this button fires its action',
    });
  }

  for (const cond of el.fieldMatchConditions ?? []) {
    const f1Ref: OutputFieldRef = {
      id: cond.field1Id,
      uuid: cond.field1Uuid,
      label: cond.field1Label,
    };
    const f2Ref: OutputFieldRef = {
      id: cond.field2Id,
      uuid: cond.field2Uuid,
      label: cond.field2Label,
    };

    conditions.push({
      type: 'fields_match',
      description: `The value entered in "${cond.field1Label}" must exactly equal the value entered in "${cond.field2Label}". If they differ, block the action and show an error on the second field.`,
      fields: [f1Ref, f2Ref],
      onMismatch: {
        action: 'showError',
        errorMessage: cond.errorMessage || 'The values do not match',
        displayOn: f2Ref,
      },
    });
  }

  for (const customRule of el.customConditions ?? []) {
    conditions.push({
      type: 'custom_rule',
      description: customRule.ruleDescription,
      onMismatch: {
        action: 'showError',
        errorMessage: customRule.errorMessage || 'Custom condition failed',
      },
    });
  }

  let onAllConditionsMet: OutputOnSuccess | undefined;
  if (el.actionType && el.actionType !== 'none') {
    // Resolve target page from the actual canvas edge (el.navigateTo is always null)
    const connectedEdge = edges.find(
      (e) => e.source === pageId && e.sourceHandle === el.id
    );
    const resolvedTargetPageId = el.navigateTo ?? connectedEdge?.target ?? null;

    const actionDescriptions: Record<string, string> = {
      navigate: 'Navigate to the configured target page',
      'api-call': `Call the API endpoint (${el.method ?? 'POST'} ${el.apiEndpoint ?? 'unset'}) and route based on the outcome`,
      secure_entry_routing:
        'Route to a page based on the format of the entered value (phone or card number)',
    };
    onAllConditionsMet = {
      actionType: el.actionType,
      targetPageId: resolvedTargetPageId,
      ...(el.actionType === 'api-call' && {
        apiEndpoint: el.apiEndpoint,
        method: el.method ?? 'POST',
        outcomes: (el.outcomes ?? []).filter(
          (o) => o.outcomeKey && o.targetPageId
        ),
      }),
      description: actionDescriptions[el.actionType] ?? el.actionType,
    };
  }

  return {
    id: el.id,
    uuid: el.uuid,
    label: el.label || el.id,
    elementType: el.elementType || 'button',
    conditions: conditions.length > 0 ? conditions : undefined,
    onAllConditionsMet,
  };
}

export function flowToOutputJson(
  nodes: Node[],
  edges: Edge[],
  navMap: unknown,
): OutputJson {
  const rawPages: OutputPage[] = [];

  for (const node of nodes) {
    const page = (node.data as { page: PageDescriptor }).page;
    if (!page) continue;

    const inputElements = page.actionElements.filter(
      (el) => el.elementType === 'input'
    );

    const elements: OutputElement[] = page.actionElements.map((el) =>
      serializeElement(el, inputElements, page.id, edges)
    );

    rawPages.push({
      id: page.id,
      uuid: page.uuid,
      name: page.name,
      elements,
    });
  }

  const navigationEdges = edges.map((edge) => {
    const sourcePage = nodes.find((n) => n.id === edge.source);
    const sp = sourcePage
      ? (sourcePage.data as { page: PageDescriptor }).page
      : null;
    const sourceElement = sp?.actionElements.find(
      (el) =>
        el.id === edge.sourceHandle ||
        `${el.id}__${edge.sourceHandle?.split('__')[1]}` === edge.sourceHandle
    );

    return {
      from: {
        pageId: edge.source,
        elementId: edge.sourceHandle ?? '',
        elementLabel: sourceElement?.label ?? edge.sourceHandle ?? '',
      },
      to: { pageId: edge.target },
      edgeType: (edge.data as { actionType?: string })?.actionType ?? 'navigate',
      ...(edge.label ? { outcomeKey: edge.label as string } : {}),
    };
  });

  return {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    pages: rawPages,
    navigationEdges,
  };
}
