import type { Node, Edge } from '@xyflow/react';
import type { PageDescriptor, ActionElement } from '@/shared/types/store';
import { serializeConditionToExpression } from '@/features/flow-editor/utils/serializeExpression';

interface OutputFieldRef {
  id: string;
  uuid?: string;
  label: string;
}

interface OutputCondition {
  type: 'all_inputs_valid' | 'fields_match' | 'custom_rule' | 'json_expression';
  description: string;
  expression?: string;
  outcomeKey?: string;
  targetPageId?: string;
  clauses?: Array<{
    leftField: string;
    operator: string;
    rightType: 'field' | 'value';
    rightField?: string;
    rightValue?: string;
  }>;
  clauseOperator?: 'AND' | 'OR';
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
  outcomes?: Array<{ outcomeKey: string; targetPageId: string; expression?: string }>;
  description: string;
}

interface OutputElement {
  id: string;
  uuid?: string;
  label: string;
  elementType: 'input' | 'button' | 'link';
  conditions?: OutputCondition[];
  onAllConditionsMet?: OutputOnSuccess;
}

interface OutputPage {
  id: string;
  uuid?: string;
  name: string;
  startingPage: boolean;
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


function serializeElement(
  el: ActionElement,
  pageId: string,
  edges: Edge[],
): OutputElement {

  const conditions: OutputCondition[] = [];

  // JSON expression conditions (structured)
  for (const jsonCond of el.jsonConditions ?? []) {
    if (!jsonCond.clauses || jsonCond.clauses.length === 0) continue;

    const expressionString = serializeConditionToExpression(jsonCond);

    conditions.push({
      type: 'json_expression',
      description: `Evaluate: ${expressionString}`,
      expression: expressionString,
      outcomeKey: jsonCond.outcomeKey,
      targetPageId: jsonCond.targetPageId,
      clauseOperator: jsonCond.clauseOperator,
      clauses: jsonCond.clauses.map(c => ({
        leftField: c.leftField,
        operator: c.operator,
        rightType: c.rightType,
        ...(c.rightType === 'field' ? { rightField: c.rightField } : { rightValue: c.rightValue }),
      })),
      onMismatch: jsonCond.errorMessage
        ? { action: 'showError', errorMessage: jsonCond.errorMessage }
        : undefined,
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
    if (el.actionType === 'navigate' && (el.jsonConditions ?? []).length > 0) {
      const validConditions = el.jsonConditions!.filter(
        c => c.clauses && c.clauses.length > 0 && c.targetPageId
      );

      const uniqueTargets = [...new Set(validConditions.map(c => c.targetPageId))];
      const resolvedTargetPageId = uniqueTargets.length === 1 ? uniqueTargets[0] : null;

      onAllConditionsMet = {
        actionType: 'conditional_navigate',
        targetPageId: resolvedTargetPageId,
        description: 'Evaluate JSON conditions in order and navigate to the first matching target page',
        outcomes: validConditions.map(c => ({
          outcomeKey: c.outcomeKey,
          targetPageId: c.targetPageId,
          expression: serializeConditionToExpression(c),
        })),
      };
    } else {
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
  startingPageId: string | null = null,
): OutputJson {
  const rawPages: OutputPage[] = [];

  for (const node of nodes) {
    const page = (node.data as { page: PageDescriptor }).page;
    if (!page) continue;

    const elements: OutputElement[] = page.actionElements.map((el) =>
      serializeElement(el, page.id, edges)
    );

    rawPages.push({
      id: page.id,
      uuid: page.uuid,
      name: page.name,
      startingPage: page.id === startingPageId,
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
