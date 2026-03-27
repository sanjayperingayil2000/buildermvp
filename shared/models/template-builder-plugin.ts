import juice from 'juice';

export interface PluginOptions {
    blocks?: string[];
    block?: (blockId: string) => Record<string, unknown>; tableStyle?: Record<string, string>;
    cellStyle?: Record<string, string>;
    cmdOpenImport?: string;
    cmdTglImages?: string;
    cmdInlineHtml?: string,
    modalTitleImport?: string;
    modalTitleExport?: string,
    modalLabelExport?: string,
    modalLabelImport?: string,
    modalBtnImport?: string,
    importPlaceholder?: string;
    inlineCss?: boolean;
    updateStyleManager?: boolean;
    showStylesOnChange?: boolean;
    showBlocksOnLoad?: boolean;
    codeViewerTheme?: string;
    juiceOpts?: juice.Options;
    textCleanCanvas?: string;
    useCustomTheme?: boolean;
};

export type RequiredPluginOptions = Required<PluginOptions>;