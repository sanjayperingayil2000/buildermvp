import type { Editor } from 'grapesjs';

export const addSecureEntryWidget = (editor: Editor) => {
  const domComps = editor.DomComponents;
  const bm = editor.Blocks;

  // 1. Define the internal behavior (Script) that runs in the browser
  const script = function (this: any) {
    const container = this as HTMLElement;
    const primaryInput = container.querySelector('.primary-input') as HTMLInputElement;
    const confirmInput = container.querySelector('.confirm-input') as HTMLInputElement;
    const clearBtns = container.querySelectorAll('.clear-btn');
    const bankLabel = container.querySelector('.bank-label') as HTMLElement;
    const validationLabel = container.querySelector('.validation-message') as HTMLElement;

    if (!primaryInput || !confirmInput || !bankLabel || !validationLabel) return;

    // Real value storage (since we mask the visible input)
    let realValue = "";

    const binDatabase: Record<string, string[]> = {
      "BBVA": ["415231", "455511", "491566", "557910"],
      "Santander": ["491573", "549140", "553011"],
      "Banorte": ["402766", "416916", "476684", "525678"],
      "Citibanamex": ["416393", "446131", "520416", "541203"],
      "HSBC": ["421316", "441221", "524021"]
    };

    // Handle Clear Buttons
    clearBtns.forEach((btn: any) => {
      btn.addEventListener('click', (e: any) => {
        const wrapper = e.target.closest('.input-wrapper');
        const input = wrapper.querySelector('input');
        if (input) {
          input.value = '';
          if (input.classList.contains('primary-input')) {
            realValue = '';
            bankLabel.innerText = '';
            primaryInput.setAttribute('data-real-value', '');
          }
        }
        validationLabel.innerText = '';
      });
    });

    // Handle Primary Input (Masking and BIN detection)
    primaryInput.addEventListener('input', (e: any) => {
      // Allow only numbers
      let val = e.target.value.replace(/\D/g, '');
      
      // Keep track of the unmasked value in a data attribute
      // We merge the new typed character with the existing real value
      if (e.inputType === 'deleteContentBackward') {
        realValue = realValue.slice(0, -1);
      } else if (e.data && /\d/.test(e.data)) {
        realValue += e.data;
      }
      
      // Limit to 16 digits max
      realValue = realValue.substring(0, 16);
      primaryInput.setAttribute('data-real-value', realValue);

      // Masking Logic: Show first 6, star the rest
      let displayValue = realValue;
      if (realValue.length > 6) {
        const visiblePart = realValue.substring(0, 6);
        const maskedPart = '*'.repeat(realValue.length - 6);
        displayValue = visiblePart + maskedPart;
      }
      primaryInput.value = displayValue;

      // BIN Recognition (Check first 6 digits)
      bankLabel.innerText = '';
      if (realValue.length >= 6) {
        const bin = realValue.substring(0, 6);
        for (const [bank, bins] of Object.entries(binDatabase)) {
          if (bins.includes(bin)) {
            bankLabel.innerText = `Recognized: ${bank}`;
            bankLabel.style.color = '#10b981'; // Green
            break;
          }
        }
      }
    });

    // Handle Confirm Input (Compare with real value)
    confirmInput.addEventListener('input', (e: any) => {
      let val = e.target.value.replace(/\D/g, '');
      val = val.substring(0, 16);
      e.target.value = val; // Assuming confirm is type="password" so browser masks it

      if (val.length === realValue.length && realValue.length > 0) {
        if (val === realValue) {
          validationLabel.innerText = 'Numbers match ✓';
          validationLabel.style.color = '#10b981';
        } else {
          validationLabel.innerText = 'Numbers do not match ✗';
          validationLabel.style.color = '#ef4444';
        }
      } else {
        validationLabel.innerText = '';
      }
    });
  };

  // 2. Define the Component Structure
  domComps.addType('secure-entry-widget', {
    model: {
      defaults: {
        script,
        tagName: 'div',
        classes: ['secure-widget-container'],
        attributes: { 'data-widget': 'secure-entry' },
        components: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background: white;">
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 5px; color: #374151;">Enter Number (Phone or Card)</label>
              <div class="input-wrapper" style="position: relative; display: flex; align-items: center;">
                <input type="text" data-widget-input="primary" class="primary-input" placeholder="Enter 12 or 16 digits" style="width: 100%; padding: 10px 30px 10px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px; letter-spacing: 2px;" />
                <span role="button" class="clear-btn" style="position: absolute; right: 8px; background: none; border: none; font-size: 18px; color: #9ca3af; cursor: pointer;">&times;</span>
              </div>
              <div class="bank-label" style="font-size: 12px; margin-top: 4px; min-height: 18px; font-weight: bold;"></div>
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 5px; color: #374151;">Confirm Number</label>
              <div class="input-wrapper" style="position: relative; display: flex; align-items: center;">
                <input type="password" class="confirm-input" placeholder="Repeat number" style="width: 100%; padding: 10px 30px 10px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px; letter-spacing: 2px;" />
                <span role="button" class="clear-btn" style="position: absolute; right: 8px; background: none; border: none; font-size: 18px; color: #9ca3af; cursor: pointer;">&times;</span>
              </div>
              <div class="validation-message" style="font-size: 12px; margin-top: 4px; min-height: 18px; font-weight: bold;"></div>
            </div>

            <button class="submit-btn" data-action-id="btn-secure-submit" style="width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer;">
              Submit securely
            </button>
          </div>
        `,
        styles: `
          .secure-widget-container { padding: 10px; }
          .clear-btn:hover { color: #374151 !important; }
          .submit-btn:hover { background: #1d4ed8 !important; }
        `
      }
    }
  });

  // 3. Add to the Drag and Drop Block Manager
  bm.add('secure-entry-block', {
    label: '<b>Secure Entry</b>',
    category: 'Custom Widgets',
    content: { type: 'secure-entry-widget' },
    attributes: { class: 'fa fa-lock' } 
  });
};
