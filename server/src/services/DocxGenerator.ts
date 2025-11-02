import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableCell,
  TableRow,
  WidthType,
  BorderStyle,
} from 'docx';

/**
 * Docx文档生成服务
 * 将周报内容转换为Word文档（.docx格式）
 */
export class DocxGenerator {
  /**
   * 从Markdown内容生成Docx文档
   * @param markdown Markdown内容
   * @param title 文档标题
   * @returns Docx文档的Buffer
   */
  static async generateFromMarkdown(markdown: string, title?: string): Promise<Buffer> {
    try {
      console.log('[DocxGenerator] Generating docx from markdown');

      // 解析Markdown并转换为docx段落
      const paragraphs = this.parseMarkdownToParagraphs(markdown, title);

      // 创建文档
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      // 生成Buffer
      const buffer = await Packer.toBuffer(doc);
      console.log('[DocxGenerator] Docx generated successfully');

      return buffer;
    } catch (error) {
      console.error('[DocxGenerator] Error generating docx:', error);
      throw new Error(
        `Failed to generate docx: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 解析Markdown并转换为docx段落
   */
  private static parseMarkdownToParagraphs(markdown: string, title?: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // 如果有标题，先添加标题段落
    if (title) {
      paragraphs.push(
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }

    // 按行分割Markdown内容
    const lines = markdown.split('\n');
    let inCodeBlock = false;
    let inList = false;
    let listItems: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 处理代码块
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) {
        // 代码块内容保持原样
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line || '',
                font: 'Courier New',
                size: 20,
              }),
            ],
          })
        );
        continue;
      }

      // 处理标题
      if (line && line.startsWith('#')) {
        // 先处理列表（如果有）
        if (inList && listItems.length > 0) {
          paragraphs.push(...this.createListParagraphs(listItems));
          listItems = [];
          inList = false;
        }

        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s+/, '');

        const headingLevel =
          level === 1
            ? HeadingLevel.HEADING_1
            : level === 2
            ? HeadingLevel.HEADING_2
            : level === 3
            ? HeadingLevel.HEADING_3
            : HeadingLevel.HEADING_4;

        paragraphs.push(
          new Paragraph({
            text,
            heading: headingLevel,
            spacing: { before: 200, after: 100 },
          })
        );
        continue;
      }

      // 处理列表
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        inList = true;
        const itemText = line.trim().substring(2);
        listItems.push(itemText);
        continue;
      } else if (inList && listItems.length > 0) {
        // 列表结束
        paragraphs.push(...this.createListParagraphs(listItems));
        listItems = [];
        inList = false;
      }

      // 处理数字列表
      if (/^\d+\.\s/.test(line.trim())) {
        const itemText = line.trim().replace(/^\d+\.\s/, '');
        paragraphs.push(
          new Paragraph({
            text: itemText,
            numbering: {
              reference: 'default-numbering',
              level: 0,
            },
            spacing: { before: 100, after: 100 },
          })
        );
        continue;
      }

      // 处理粗体和斜体
      if (line.includes('**') || line.includes('*') || line.includes('`')) {
        paragraphs.push(this.parseStyledLine(line));
        continue;
      }

      // 处理分隔线
      if (line.trim() === '---' || line.trim() === '***') {
        paragraphs.push(
          new Paragraph({
            text: '────────────────────────────────────',
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          })
        );
        continue;
      }

      // 处理空行
      if (line.trim() === '') {
        paragraphs.push(
          new Paragraph({
            text: '',
            spacing: { after: 100 },
          })
        );
        continue;
      }

      // 普通文本段落
      paragraphs.push(
        new Paragraph({
          text: line || '',
          spacing: { after: 100 },
        })
      );
    }

    // 处理最后的列表（如果有）
    if (inList && listItems.length > 0) {
      paragraphs.push(...this.createListParagraphs(listItems));
    }

    return paragraphs;
  }

  /**
   * 创建列表段落
   */
  private static createListParagraphs(items: string[]): Paragraph[] {
    return items.map(
      (item) =>
        new Paragraph({
          text: `• ${item}`,
          spacing: { before: 50, after: 50 },
          indent: { left: 360 },
        })
    );
  }

  /**
   * 解析带样式的行（粗体、斜体、代码）
   */
  private static parseStyledLine(line: string): Paragraph {
    const children: TextRun[] = [];
    let currentPos = 0;

    // 简化处理：分割文本并识别样式
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

    parts.forEach((part) => {
      if (!part) return;

      // 粗体
      if (part.startsWith('**') && part.endsWith('**')) {
        children.push(
          new TextRun({
            text: part.slice(2, -2),
            bold: true,
          })
        );
      }
      // 斜体
      else if (part.startsWith('*') && part.endsWith('*')) {
        children.push(
          new TextRun({
            text: part.slice(1, -1),
            italics: true,
          })
        );
      }
      // 代码
      else if (part.startsWith('`') && part.endsWith('`')) {
        children.push(
          new TextRun({
            text: part.slice(1, -1),
            font: 'Courier New',
            size: 20,
          })
        );
      }
      // 普通文本
      else {
        children.push(new TextRun(part));
      }
    });

    return new Paragraph({
      children,
      spacing: { after: 100 },
    });
  }

  /**
   * 创建表格
   * @param headers 表头
   * @param rows 表格行数据
   * @returns Table对象
   */
  private static createTable(headers: string[], rows: string[][]): Table {
    const tableRows: TableRow[] = [];

    // 添加表头
    tableRows.push(
      new TableRow({
        children: headers.map(
          (header) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: header, bold: true })],
                }),
              ],
              width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
            })
        ),
      })
    );

    // 添加数据行
    rows.forEach((row) => {
      tableRows.push(
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                children: [new Paragraph(cell)],
                width: { size: 100 / row.length, type: WidthType.PERCENTAGE },
              })
          ),
        })
      );
    });

    return new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
  }
}

