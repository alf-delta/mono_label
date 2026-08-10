import assert from 'node:assert/strict';
import test from 'node:test';
import { fitText } from '../src/label/validation/fit-text';
import { COFFEE_LABEL_V1 } from '../src/label/templates/coffee-label-v1';
import type { TextMeasurer } from '../src/label/typography/text-measurer';

test('anaerobic natural fits the calibrated processing region', () => {
  const box = COFFEE_LABEL_V1.regions.processing;
  const availableWidth = box.width - COFFEE_LABEL_V1.metadataLabelWidthMm;

  // Browser measurement from the bundled Montserrat Bold font: at 2.2 mm the
  // phrase is 25.814 mm wide, just over the 25.6 mm metadata value column.
  const measurer: TextMeasurer = {
    measure(text, _fontRole, fontSize) {
      const widthAtOneMm = text === 'ANAEROBIC NATURAL' ? 25.814 / 2.2 : text.length * 0.5;
      return { width: widthAtOneMm * fontSize, height: fontSize };
    },
  };

  const layout = fitText({ lines: ['ANAEROBIC NATURAL'], box, availableWidth, measurer });

  assert.equal(layout.fits, true);
  assert.ok(layout.fontSize < 2.2);
  assert.ok(layout.fontSize >= box.minFontSize);
  assert.ok(layout.measuredWidth <= availableWidth);
});
