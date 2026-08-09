declare module 'svg-to-pdfkit' {
  import type PDFDocument from 'pdfkit';
  interface SvgToPdfOptions {
    width?: number;
    height?: number;
    preserveAspectRatio?: string;
    assumePt?: boolean;
    precision?: number;
    warningCallback?: (message: string) => void;
  }
  export default function svgToPdf(
    document: PDFDocument,
    svg: string,
    x: number,
    y: number,
    options?: SvgToPdfOptions,
  ): void;
}
