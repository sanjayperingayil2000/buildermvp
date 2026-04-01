import type { Plugin } from 'grapesjs';

export const bankListWidgetPlugin: Plugin = (editor) => {
  const domComps = editor.DomComponents;
  const bm = editor.BlockManager;

  // Add the Bank List Component
  domComps.addType('bank-list-widget', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: false,
        attributes: { class: 'bank-list-wrapper' },
        components: `
          <div style="font-family: system-ui, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 16px; text-align: center;">Select Bank</h2>
            
            <div style="display: flex; flexDirection: column; gap: 12px;">
              <button 
                class="bank-list-item" 
                data-dynamic-nav="context-link"
                data-action-id="select-bbva"
                data-bank-id="bbva"
                style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s ease; background: #fff; width: 100%; text-align: left;"
              >
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; border-radius: 8px; background: #072146; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px;">BBVA</div>
                  <span style="font-size: 16px; font-weight: 600; color: #334155;">BBVA Bancomer</span>
                </div>
                <span style="color: #94a3b8;">→</span>
              </button>
              
              <button 
                class="bank-list-item" 
                data-dynamic-nav="context-link"
                data-action-id="select-santander"
                data-bank-id="santander"
                style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s ease; background: #fff; width: 100%; text-align: left;"
              >
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; border-radius: 8px; background: #ec0000; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px;">SAN</div>
                  <span style="font-size: 16px; font-weight: 600; color: #334155;">Santander</span>
                </div>
                <span style="color: #94a3b8;">→</span>
              </button>

              <button 
                class="bank-list-item" 
                data-dynamic-nav="context-link"
                data-action-id="select-banorte"
                data-bank-id="banorte"
                style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s ease; background: #fff; width: 100%; text-align: left;"
              >
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; border-radius: 8px; background: #eb0029; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px;">BNT</div>
                  <span style="font-size: 16px; font-weight: 600; color: #334155;">Banorte</span>
                </div>
                <span style="color: #94a3b8;">→</span>
              </button>
            </div>
            
            <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 24px;">Note: Items act as generic dynamic triggers during logic routing.</p>
          </div>
        `,
        styles: `
          .bank-list-item:hover {
            border-color: #3b82f6 !important;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1) !important;
          }
        `,
      },
    },
  });

  // Add the Bank List Block
  bm.add('bank-list-widget-block', {
    label: `
      <div style="padding: 10px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <svg style="width: 24px; height: 24px; margin: 0 auto 8px; display: block;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <div style="font-weight: 600; font-size: 14px;">Bank List</div>
        <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">Dynamic Option</div>
      </div>
    `,
    category: 'Forms & Widgets',
    content: { type: 'bank-list-widget' },
  });
};
