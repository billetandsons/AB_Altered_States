# AB_RenderLayerStates

** Like versions?
** Love Exporting?
** Hate toggling layers on and off?
 This Illustrator ExtendScript does the tedious part for you — for each **Toggle** layer you pick, it flips that layer on (keeping your **Always ON** layers visible), exports a file, and moves on. All your design variants, done in one pass.
 ** Keep all your versions in one file, ready to render!

---

## Installation

**Quick run (no install needed)**
Just open the `.jsx` in VS Code with the ExtendScript Debugger, set the target to **Adobe Illustrator**, and hit Run. Done.

**Permanent install — show up in File > Scripts**

Drop the `.jsx` into Illustrator's Scripts folder and it'll appear in the menu every time you launch.

- **Windows:** `C:\Program Files\Adobe\Adobe Illustrator [version]\Presets\en_US\Scripts\`
- **Mac:** `/Applications/Adobe Illustrator [version]/Presets/en_US/Scripts/`

Restart Illustrator after copying. Then it's at **File > Scripts > AB_RenderLayerStates_04**.

---

## Requirements

- Adobe Illustrator CS6 or later
- VS Code + [ExtendScript Debugger](https://marketplace.visualstudio.com/items?itemName=Adobe.extendscript-debug) (for quick-run workflow)

---

## How to Use

1. Open your `.ai` file and **save it** — exports land right beside it by default
2. Run the script (VS Code or File > Scripts)
3. Set up the dialog and hit **Export**

---

## UI Overview

![Render Layer States dialog](Render%20Layer.jpg)

### File Name Prefix
| Option | Result |
|---|---|
| Use current file name | `MyFile_LayerName.png` |
| Use custom prefix | `MyPrefix_LayerName.png` |
| No prefix | `LayerName.png` |

### Export Format
| Option | Notes |
|---|---|
| PNG + Alpha | 24-bit PNG with transparency (default) |
| PNG no Alpha | 24-bit PNG, solid background |
| JPEG | Quality 1–100 (default 85), saves as `.jpg` |

### Export Resolution
Pick any combo of **1x / 2x / 3x**. Multi-scale exports get suffixes automatically:
```
MyFile_LayerName.png
MyFile_LayerName@2x.png
MyFile_LayerName@3x.png
```

### Output Folder
- **Default** — creates a `_layer_state_exports/` folder beside the `.ai` file
- **Choose folder** — browse wherever you like

### Layer Lists

![Illustrator layers](AI%20Layers%20Window.jpg)

| Panel | What it does |
|---|---|
| **Always ON** (green) | These layers stay visible in every single export |
| **Toggle / Export States** (blue) | One export file is produced per selected layer |

Use **All / None** for quick selection. Both lists are multi-select.

If files already exist in the output folder, you'll get a prompt to overwrite or skip them.

---

## Output Example

Setup: Always ON = `BG Tone`, `Pic` — Toggle = `Title Wingdings`, `Title Acumin Cond Med`, `Title Egizio URW`

```
_layer_state_exports/
  MyFile_Title Wingdings.png
  MyFile_Title Acumin Cond Med.png
  MyFile_Title Egizio URW.png
```

---

## Version History

| Version | What changed |
|---|---|
| v01 | First version |
| v02 | Always ON layer support, overwrite prompt, reveal folder option |
| v03 | Custom output folder, scale/resolution options, duplicate layer warning |
| v04 | Export format selector (PNG+Alpha / PNG no Alpha / JPEG+quality), colour-coded panels |
