import type { Editor } from 'grapesjs';

export const addFuelAmountWidget = (editor: Editor) => {
    const domComps = editor.DomComponents;
    const bm = editor.Blocks;

    // Script: handles button press feedback and basic mock input behavior
    const script = function (this: any) {
        const container = this as HTMLElement;
        const input = container.querySelector('.calc-input') as HTMLInputElement;
        const numpadBtns = container.querySelectorAll('.numpad-btn, .preset-btn');
        const tabs = container.querySelectorAll('.tab-btn');

        // Button click animations
        numpadBtns.forEach((btn: any) => {
            btn.addEventListener('mousedown', () => {
                btn.style.transform = 'scale(0.95)';
                btn.style.transition = 'transform 0.1s ease';
            });
            btn.addEventListener('mouseup', () => {
                btn.style.transform = 'scale(1)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
            });
        });

        // Tab switching visual logic
        tabs.forEach((tab: any) => {
            tab.addEventListener('click', () => {
                tabs.forEach((t: any) => {
                    t.classList.remove('tab-active');
                    t.style.background = '#FFF';
                    t.style.color = '#1C1B1B';
                });
                tab.classList.add('tab-active');
                tab.style.background = '#DA291B';
                tab.style.color = '#FFF';
            });
        });
    };

    domComps.addType('fuel-calc-widget', {
        model: {
            defaults: {
                script,
                tagName: 'div',
                droppable: false,
                attributes: {
                    'data-widget': 'fuel-calculator',
                    'class': 'fuel-calc-widget-root',
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

            <div class="calc-card">
              
              <div class="premium-tag">
                <svg xmlns="http://www.w3.org/2000/svg" width="163" height="70" viewBox="0 0 163 70" fill="none">
                  <rect width="162.361" height="70" rx="7.77778" fill="#DA291B"/>
                </svg>
                <span class="premium-tag-text">Premium</span>
              </div>

              <div class="calc-tabs">
                <div class="tab-btn tab-monto tab-active">Monto</div>
                <div class="tab-btn tab-litros">Litros</div>
                <div class="tab-btn tab-tanque">Tanque Lleno</div>
              </div>

              <input type="text" class="calc-input" placeholder="$0" readonly />

              <div class="preset-row">
                <button class="preset-btn">$1,500</button>
                <button class="preset-btn">$1,000</button>
                <button class="preset-btn">$750</button>
                <button class="preset-btn">$500</button>
              </div>

              <div class="numpad-grid">
                <button class="numpad-btn">1</button>
                <button class="numpad-btn">2</button>
                <button class="numpad-btn">3</button>
                <button class="numpad-btn">4</button>
                <button class="numpad-btn">5</button>
                <button class="numpad-btn">6</button>
                <button class="numpad-btn">7</button>
                <button class="numpad-btn">8</button>
                <button class="numpad-btn">9</button>
                <button class="numpad-btn backspace-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
                </button>
                <button class="numpad-btn">0</button>
                <button class="numpad-btn">.</button>
              </div>

            </div>
          </div>
        `,
                styles: `
          .fuel-calc-widget-root {
            width: 100%;
            font-family: 'Inter', sans-serif;
          }
          .fuel-main-content {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px 20px;
            overflow: hidden;
            background-color: #F0F0F0;
            min-height: 650px;
          }
          .fuel-bg-graphics-layer {
            position: absolute;
            inset: 0;
            background-color: #FFFFFF;
            opacity: 0.1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 0;
            pointer-events: none;
          }
          .fuel-bg-bar {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            margin-top: -50px;
          }

          /* New Calculator Card Styles */
          .calc-card {
            position: relative;
            z-index: 1;
            display: flex;
            width: 580px;
            height: 556px;
            padding: 20px;
            flex-direction: column;
            align-items: flex-start;
            gap: 13.5px;
            border-radius: 20px;
            border: 1px solid #E0E0E0; /* Schemes-Outline-Variant */
            background: #FFF; /* Schemes-Surface-Container-Lowest */
            box-shadow: 0 22.5px 45px -10.8px rgba(0, 0, 0, 0.25);
            box-sizing: border-box;
          }

          .premium-tag {
            position: absolute;
            top: -20px;
            right: 30px;
            width: 162.361px;
            height: 70px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .premium-tag svg {
            position: absolute;
            top: 0;
            left: 0;
            z-index: -1;
          }
          .premium-tag-text {
            color: #FFF;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .calc-tabs {
            display: flex;
            flex-direction: row;
            align-items: center;
            width: 100%;
            margin-bottom: 5px;
            margin-top: 15px;
          }
          .tab-btn {
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .tab-monto {
            display: flex;
            min-height: 40px;
            padding: 9.5px 12px;
            justify-content: center;
            align-items: center;
            gap: 8px;
            flex: 1;
            border-radius: 20px 0 0 20px;
            border: 1px solid #E0E0E0;
            background: #DA291B; /* Custom Color 1 Container */
            color: #FFF;
          }
          .tab-litros {
            display: flex;
            min-height: 40px;
            padding: 9.5px 12px;
            justify-content: center;
            align-items: center;
            gap: 8px;
            flex: 1;
            border-top: 1px solid #E0E0E0;
            border-bottom: 1px solid #E0E0E0;
            background: #FFF;
            color: #1C1B1B;
          }
          .tab-tanque {
            display: flex;
            min-height: 40px;
            padding: 9.5px 12px;
            justify-content: center;
            align-items: center;
            gap: 8px;
            flex: 1;
            border-radius: 0 20px 20px 0;
            border: 1px solid #E0E0E0;
            background: #FFF;
            color: #1C1B1B;
          }

          .calc-input {
            display: flex;
            width: 537.3px;
            height: 76.5px;
            min-height: 32.4px;
            padding: 7.5px 12px;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
            border-radius: 8px;
            border: 1px solid #E0E0E0;
            background: #FCFCFC; /* Schemes-Surface-Bright */
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            font-size: 48px;
            font-weight: 700;
            color: #1C1B1B;
            text-align: right;
            box-sizing: border-box;
            outline: none;
          }
          .calc-input::placeholder {
            color: #A0A0A0;
          }

          .preset-row {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
            gap: 8px;
            margin-top: 10px;
            margin-bottom: 10px;
          }
          .preset-btn {
            display: flex;
            min-height: 40px;
            padding: 9.5px 24px;
            justify-content: center;
            align-items: center;
            gap: 8px;
            flex: 1 0 0;
            border-radius: 16px;
            background: #DA291B; /* Custom Color 1 Container */
            color: #FFF;
            font-size: 18px;
            font-weight: 600;
            border: none;
            cursor: pointer;
          }

          .numpad-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            width: 100%;
            flex-grow: 1;
            margin-top: 10px;
          }
          .numpad-btn {
            display: flex;
            width: 174.3px;
            min-height: 56px; /* Slightly increased for better tap area while keeping layout proportional */
            padding: 8.55px 21.6px;
            justify-content: center;
            align-items: center;
            gap: 7.2px;
            border-radius: 8px;
            border: 1px solid #E0E0E0;
            background: #F0F0F0; /* Schemes-Surface-Container */
            box-shadow: 0 0.9px 2.7px 0 rgba(0, 0, 0, 0.10), 0 0.9px 1.8px 0 rgba(0, 0, 0, 0.06);
            font-size: 28px;
            font-weight: 600;
            color: #1C1B1B;
            cursor: pointer;
            box-sizing: border-box;
          }
          .backspace-btn {
            color: #DA291B;
          }
        `,
            },
        },
    });

    bm.add('fuel-calc-block', {
        label: '<b>Fuel Calculator</b>',
        category: 'Kiosk Widgets',
        content: { type: 'fuel-calc-widget' },
        attributes: { class: 'fa fa-calculator', title: 'Fuel calculator card with numpad and preset amounts' },
    });
};