import fs from 'node:fs';
import path from 'node:path';

const root = '/Users/bytedance/Documents/摄影学习';
const run = path.join(root, 'validation/20260811-formal-composition-rubric-v5-13');
const ids = [
  '20260729-224116-yellow-flowers-soft-focus',
  '20260729-223208-purple-flower-closeup',
  '20260729-122330-resting-camel-group',
  '20260729-224036-yellow-flower-green-bokeh',
  '20260729-153601-lotus-among-leaves',
  '20260711-171151-seaside-bubble-girl',
  '20260729-171306-child-running-park-path',
  '20260729-122516-child-sand-play-shadow',
  '20260729-153826-centered-lotus-bud-seedpod',
  '20260729-192903-hilltop-pavilion-leading-path',
  '20260729-123304-mountain-ridge-railing-overlook',
  '20260729-172017-child-running-green-corridor',
  '20260729-171746-bridge-pillars-reflection',
  '20260729-171453-wooden-bridge-mountain-arch',
  '20260729-154220-lotus-bloom-and-bud',
  '20260729-193600-birds-on-diagonal-power-lines-blue-sky',
  '20260729-193912-prayer-flags-mountain-pavilion',
  '20260711-182413-purple-light-corridor-reflection',
  '20260729-153444-pink-lotus-leaf-pattern',
  '20260729-154647-lotus-leaf-yellow-flowers-overhead',
  '20260729-224928-purple-wildflowers-busy-grass',
  '20260710-221616-hanging-fabrics',
  '20260729-193734-barbed-wire-grass-pattern',
  '20260729-154452-yellow-water-flowers-pattern',
  '20260721-225306-red-brick-gables',
  '20260711-143415-concrete-cones-staircase',
  '20260604-211358-mosque-arcade-water',
  '20260729-154630-blue-sky-treeline-negative-space',
  '20260729-121727-pale-dunes-blue-sky',
  '20260729-201126-vivid-blue-sky-green-grassland',
  '20260729-192421-grassland-sky-thistles',
  '20260729-122056-desert-ridge-blue-sky',
  '20260711-135526-sea-breakwater-lighthouses',
  '20260711-185503-candle-dark-table',
  '20260609-160643-kristaps',
];

for (let index = 0; index < ids.length; index += 1) {
  const number = String(index + 1).padStart(2, '0');
  const sourceDir = path.join(root, 'data/archive', ids[index]);
  const targetDir = path.join(run, 'blind-inputs', number);
  const metadata = JSON.parse(fs.readFileSync(path.join(sourceDir, 'metadata.json'), 'utf8'));
  const originals = fs.readdirSync(sourceDir).filter((name) => /^original\./.test(name));
  if (originals.length !== 1) throw new Error(`Expected one original for ${ids[index]}`);
  const original = originals[0];
  const safeMetadata = {
    image_file_saved: metadata.image_file_saved,
    original_file: original,
    mime_type: metadata.mime_type,
    pixel_width: metadata.pixel_width,
    pixel_height: metadata.pixel_height,
    image_dimensions: metadata.image_dimensions,
    color_profile: metadata.color_profile,
    visible_orientation: metadata.visible_orientation,
  };
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'metadata.json'), `${JSON.stringify(safeMetadata, null, 2)}\n`);
  fs.copyFileSync(path.join(sourceDir, original), path.join(targetDir, original));
}
