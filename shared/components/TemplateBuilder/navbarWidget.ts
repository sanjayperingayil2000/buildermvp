import type { Editor } from 'grapesjs';

export const addNavbarWidget = (editor: Editor) => {
  const domComps = editor.DomComponents;
  const bm = editor.Blocks;

  domComps.addType('navbar-widget', {
    model: {
      defaults: {
        tagName: 'footer',
        droppable: false,
        attributes: {
          'data-widget': 'kiosk-navbar',
          'class': 'kiosk-navbar',
        },
        // Traits allow the client to swap logo URLs from the right panel
        traits: [
          {
            type: 'text',
            name: 'data-logo-src',
            label: 'Logo image URL',
            placeholder: './assets/petroseven.png',
            changeProp: false,
          },
          {
            type: 'text',
            name: 'data-logo-alt',
            label: 'Logo alt text',
            placeholder: 'Company Logo',
            changeProp: false,
          },
        ],
        components: `
          <img
            class="navbar-logo"
            src="./assets/petroseven.png"
            alt="Company Logo"
            style="background-color: transparent;"
          />
        `,
        styles: `
          .kiosk-navbar {
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

      // When the data-logo-src trait changes, update the img src
      init() {
        this.on('change:attributes', this.onAttrChange);
      },

      onAttrChange(this: any) {
        const attrs = this.getAttributes();
        const logoSrc = attrs['data-logo-src'];
        const logoAlt = attrs['data-logo-alt'];
        if (!logoSrc && !logoAlt) return;

        const imgComp = this.find('.navbar-logo')[0];
        if (!imgComp) return;

        if (logoSrc) imgComp.addAttributes({ src: logoSrc });
        if (logoAlt) imgComp.addAttributes({ alt: logoAlt });
      },
    },
  });

  bm.add('navbar-block', {
    label: '<b>Kiosk Navbar</b>',
    category: 'Kiosk Widgets',
    content: { type: 'navbar-widget' },
    attributes: { class: 'fa fa-minus-square', title: 'Bottom navbar with company logo' },
  });
};
