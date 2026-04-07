import type { Editor } from 'grapesjs';

export const addFuelCardWidget = (editor: Editor) => {
  const domComps = editor.DomComponents;
  const bm = editor.Blocks;

  // Script: handles button hover states and active press feedback
  const script = function (this: any) {
    const container = this as HTMLElement;
    const fuelBtns = container.querySelectorAll('.fuel-btn-container');

    fuelBtns.forEach((btn: any) => {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-3px)';
        btn.style.transition = 'transform 0.2s ease';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
      });
      btn.addEventListener('mousedown', () => {
        btn.style.transform = 'translateY(0) scale(0.98)';
      });
      btn.addEventListener('mouseup', () => {
        btn.style.transform = 'translateY(-3px)';
      });
    });
  };

  domComps.addType('fuel-card-widget', {
    model: {
      defaults: {
        script,
        tagName: 'div',
        droppable: false,
        attributes: {
          'data-widget': 'fuel-card',
          'class': 'fuel-card-widget-root',
        },
        components: `
          <div class="fuel-main-content">

            <div class="bg-graphics-layer">
      <div class="bg-bar">
        <svg xmlns="http://www.w3.org/2000/svg" width="584" height="281" viewBox="0 0 584 281" fill="none">
          <path d="M584 217.091L55.5879 217.091L-184 -3.35703e-05L-184 187.96L55.5879 281L584 281L584 217.091Z"
            fill="#FF5F00" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="584" height="282" viewBox="0 0 584 282" fill="none">
          <path
            d="M9.49542e-06 217.23L528.88 217.23L768.68 -3.36001e-05L768.68 188.08L528.88 281.18L1.22908e-05 281.18L9.49542e-06 217.23Z"
            fill="#FF5F00" />
        </svg>
      </div>

      <div class="bg-bar">
        <svg width="584" height="188" viewBox="0 0 584 188" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M584 62.0436L55.5879 62.0436L-184 -3.35703e-05L-184 188L55.5879 125.956L584 125.956L584 62.0336L584 62.0436Z"
            fill="#007852" />
        </svg>
        <svg width="584" height="189" viewBox="0 0 584 189" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2.71317e-06 62.07L528.88 62.07L768.68 -3.36001e-05L768.68 188.08L528.88 126.01L5.50807e-06 126.01L2.71273e-06 62.06L2.71317e-06 62.07Z"
            fill="#007852" />
        </svg>
      </div>

      <div class="bg-bar">
        <svg xmlns="http://www.w3.org/2000/svg" width="584" height="281" viewBox="0 0 584 281" fill="none">
          <path d="M584 0L55.5879 -2.30976e-05L-184 93.0404L-184 281L55.5879 63.9091L584 63.9091L584 0Z"
            fill="#E2231A" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="584" height="282" viewBox="0 0 584 282" fill="none">
          <path d="M0 0L528.88 -2.31181e-05L768.68 93.0999L768.68 281.18L528.88 63.95L2.79534e-06 63.95L0 0Z"
            fill="#E2231A" />
        </svg>
      </div>
    </div>

            <div class="fuel-card">
      <h1 class="fuel-title">Selecciona tu tipo de combustible</h1>

      <button class="fuel-btn-container btn-premium">
        <span class="fuel-text">Premium</span>
      </button>

      <button class="fuel-btn-container btn-magna">
        <span class="fuel-text">Magna</span>
      </button>

      <button class="fuel-btn-container btn-diesel">
        <span class="fuel-text">Diesel</span>
      </button>
    </div>

          </div>
        `,
        styles: `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      background-color: #F0F0F0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .top-header {
      position: relative;
      display: flex;
      align-items: center;
      padding: 16px 24px;
      width: 100%;
      height: 82px;
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

    .login-text {
      font-weight: 400;
      font-size: 14px;
      line-height: 16px;
      text-align: center;
      letter-spacing: 0.4px;
      color: #226A4D;
    }

    .login-rectangle-logo {
      width: 111px;
      height: 30px;
      object-fit: contain;
    }

    .caret-icon {
      width: 24px;
      height: 24px;
      color: #226A4D;
    }

    .fuel-main-content {
      position: relative;
      flex-grow: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      overflow: hidden;
    }

    .bg-graphics-layer {
      position: absolute;
      inset: 0;
      background-color: #FFFFFF;
      opacity: 0.1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: -10px;
      z-index: 0;
    }

    .bg-bar {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      margin-top: -50px;
    }

    .fuel-card {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 20px;
      gap: 16px;
      width: 100%;
      max-width: 580px;
      background: #FFFFFF;
      border: 1px solid #E0E0E0;
      box-shadow: 0px 22.5px 45px -10.8px rgba(0, 0, 0, 0.25);
      border-radius: 19.8px;
    }

    .fuel-title {
      font-weight: 600;
      font-size: 30px;
      line-height: 40px;
      text-align: center;
      color: #1C1B1B;
      margin-bottom: 8px;
    }

    .fuel-btn-container {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 4px 24px;
      width: 100%;
      max-width: 540px;
      height: 142.67px;
      border-radius: 16px;
      cursor: pointer;
      border: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .fuel-btn-container:hover {
      transform: translateY(-2px);
    }

    .fuel-text {
      font-weight: 700;
      font-size: 60px;
      line-height: 64px;
      text-align: center;
      letter-spacing: -0.25px;
      color: #FFFFFF;
    }

    .btn-premium {
      background: #DA291B;
      box-shadow: 0px 12px 8px -8px rgba(0, 0, 0, 0.35), inset 0px 3px 3px rgba(255, 255, 255, 0.55);
    }

    .btn-magna {
      background: #009F4D;
      box-shadow: 0px 12px 8px -8px rgba(0, 0, 0, 0.35), inset 0px 2px 2px rgba(255, 255, 255, 0.55);
    }

    .btn-diesel {
      background: #171818;
      box-shadow: 0px 12px 8px -8px rgba(0, 0, 0, 0.35), inset 0px 2px 2px rgba(255, 255, 255, 0.55);
    }

    .navbar {
      height: 84px;
      width: 100%;
      background: #FFFFFF;
      border-top: 1px solid #E0E0E0;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
      position: relative;
      z-index: 2;
    }

    .navbar-logo {
      width: 199px;
      height: 60px;
      object-fit: contain;
    }
        `,
      },
    },
  });

  bm.add('fuel-card-block', {
    label: '<b>Fuel Selector</b>',
    category: 'Kiosk Widgets',
    content: { type: 'fuel-card-widget' },
    attributes: { class: 'fa fa-tint', title: 'Fuel type selection card with Premium, Magna and Diesel buttons' },
  });
};
