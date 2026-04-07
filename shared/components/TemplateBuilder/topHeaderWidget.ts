import type { Editor } from 'grapesjs';

export const addTopHeaderWidget = (editor: Editor) => {
  const domComps = editor.DomComponents;
  const bm = editor.Blocks;

  // Script that runs inside the canvas — handles theme toggle click
  const script = function (this: any) {
    const container = this as HTMLElement;
    const toggleBtn = container.querySelector('.theme-toggle') as HTMLButtonElement;
    const icon = container.querySelector('.theme-toggle-icon') as HTMLElement;

    if (!toggleBtn) return;

    let isDark = false;

    toggleBtn.addEventListener('click', () => {
      isDark = !isDark;
      // Visual feedback on the icon — swap between sun and moon mask
      if (isDark) {
        icon.style.backgroundColor = '#1e293b';
        toggleBtn.style.background = '#e2e8f0';
      } else {
        icon.style.backgroundColor = '#727A7A';
        toggleBtn.style.background = '#D9D9D9';
      }
    });
  };

  domComps.addType('top-header-widget', {
    model: {
      defaults: {
        script,
        tagName: 'header',
        droppable: false,
        attributes: {
          'data-widget': 'top-header',
          'class': 'top-header',
        },
        components: `
          <button class="theme-toggle" aria-label="Toggle Light Mode" data-flow-ignore="true">
            <div class="theme-toggle-icon"></div>
          </button>

          <a href="#" class="login-btn" data-action-id="btn-header-login">
            <span class="login-text">Ingresa aquí a tu cuenta</span>
            <svg class="caret-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        `,
        styles: `
          .top-header {
            position: relative;
            display: flex;
            align-items: center;
            padding: 16px 24px;
            width: 100%;
            height: 82px;
            background: #F0F0F0;
          }
          .theme-toggle {
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #D9D9D9;
            border-radius: 50%;
            cursor: pointer;
            border: none;
            position: relative;
            z-index: 2;
            flex-shrink: 0;
          }
          .theme-toggle-icon {
            width: 24px;
            height: 24px;
            background-color: #727A7A;
            mask: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" fill="black"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="black" stroke-width="2" stroke-linecap="round"/></svg>') no-repeat center / contain;
            -webkit-mask: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" fill="black"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="black" stroke-width="2" stroke-linecap="round"/></svg>') no-repeat center / contain;
          }
          .login-btn {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            padding: 10px 16px;
            gap: 8px;
            background: #FFFFFF;
            border: 2px solid #007852;
            border-radius: 12px;
            cursor: pointer;
            text-decoration: none;
            z-index: 1;
          }
          .login-btn:hover {
            background: #f0fdf4;
          }
          .login-text {
            font-weight: 400;
            font-size: 14px;
            line-height: 16px;
            text-align: center;
            letter-spacing: 0.4px;
            color: #226A4D;
            font-family: 'Inter', sans-serif;
          }
          .caret-icon {
            width: 24px;
            height: 24px;
            color: #226A4D;
          }
        `,
      },
    },
  });

  bm.add('top-header-block', {
    label: '<b>Top Header</b>',
    category: 'Kiosk Widgets',
    content: { type: 'top-header-widget' },
    attributes: { class: 'fa fa-window-maximize', title: 'Header with login button and theme toggle' },
  });
};
