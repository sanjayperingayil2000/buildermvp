import TemplateBuilder from "@/shared/components/TemplateBuilder/TemplateBuilder";
import AppHeader from "@/shared/components/AppHeader";

export default function BuilderPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppHeader />
      
      {/* 👈 Added display: 'flex' and flexDirection: 'column' here */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TemplateBuilder />
      </div>

      <div
        style={{
          padding: '10px 20px',
          background: '#2b2e3b',
          borderTop: '1px solid #3a3f4e',
          color: '#9ca3af',
          fontSize: '13px',
          textAlign: 'center',
          flexShrink: 0, // 👈 Prevents footer from squishing
        }}
      >
        After designing your pages, click Save, then go to Logic Builder to configure navigation.
      </div>
    </div>
  );
}