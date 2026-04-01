import type { Plugin } from 'grapesjs';

export const dynamicBankDetailsWidgetPlugin: Plugin = (editor) => {
  const domComps = editor.DomComponents;
  const bm = editor.BlockManager;

  domComps.addType('dynamic-bank-details', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: false,
        attributes: { class: 'dynamic-bank-details-wrapper' },
        components: `
          <div style="font-family: system-ui, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px;">
              <div style="width: 80px; height: 80px; border-radius: 50%; background: #f8fafc; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid #e2e8f0;">
                <img data-dynamic="bank-logo" src="https://via.placeholder.com/150" alt="Bank Logo" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;" />
              </div>
              
              <div>
                <h2 data-dynamic="bank-name" style="font-size: 24px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0;">Bank Name</h2>
                <p data-dynamic="bank-desc" style="font-size: 14px; color: #64748b; margin: 0; line-height: 1.5;">Bank description will appear here.</p>
              </div>

              <div style="width: 100%; height: 1px; background: #e2e8f0; margin: 8px 0;"></div>

              <div style="width: 100%; background: #f1f5f9; padding: 16px; border-radius: 12px; text-align: left;">
                <div style="font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 4px;">Account Status</div>
                <div style="font-size: 15px; color: #10b981; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
                  Verified & Active
                </div>
              </div>

              <button data-action-id="btn-return-home" style="width: 100%; padding: 14px; border-radius: 10px; border: none; background: #0f172a; color: white; font-weight: 600; font-size: 15px; cursor: pointer; margin-top: 8px;">
                Return Home
              </button>
            </div>
          </div>
        `,
      },
    },
  });

  bm.add('dynamic-bank-details-block', {
    label: `
      <div style="padding: 10px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <svg style="width: 24px; height: 24px; margin: 0 auto 8px; display: block;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
        </svg>
        <div style="font-weight: 600; font-size: 14px;">Bank Details</div>
        <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">Dynamic Receiver</div>
      </div>
    `,
    category: 'Forms & Widgets',
    content: { type: 'dynamic-bank-details' },
  });
};
