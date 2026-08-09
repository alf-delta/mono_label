# Print export boundary

Milestone 7 freezes the exact reviewed label, converts every glyph and brew icon to SVG paths, and sends that outlined SVG to the server-side PDF compositor.

The compositor repeats the canonical label on a physical sheet, draws optional trim/registration/cutter marks, and emits a vector PDF. Sheet geometry is shared by the browser preview and the PDF endpoint through `imposition.ts`.

Current v1 formats: ISO A4/A3 and US Letter/Tabloid. The PDF architecture keeps physical units and separate mark layers so CMYK and PDF/X can be added later without changing label geometry.
