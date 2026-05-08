#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("Open an Illustrator document first.");
        return;
    }

    var doc = app.activeDocument;

    if (!doc.fullName) {
        alert("Save the Illustrator file first. Exports go beside the .ai file.");
        return;
    }

    var docFolder   = doc.fullName.parent;
    var docBaseName = doc.name.replace(/\.[^\.]+$/, "");

    var layers = [];
    for (var i = 0; i < doc.layers.length; i++) {
        layers.push(doc.layers[i].name);
    }

    var picked = showLayerDialog(layers, docBaseName);
    if (!picked) return;

    if (picked.toggle.length === 0) {
        alert("Pick at least one toggle/export layer.");
        return;
    }

    // ── Warn about duplicate layer names ──────────────────────────────
    var nameCounts = {};
    for (var d = 0; d < picked.toggle.length; d++) {
        nameCounts[picked.toggle[d]] = (nameCounts[picked.toggle[d]] || 0) + 1;
    }
    var dupes = [];
    for (var key in nameCounts) {
        if (nameCounts[key] > 1) dupes.push(key);
    }
    if (dupes.length > 0) {
        alert("Warning: duplicate layer names detected — exports may overwrite each other:\n" + dupes.join(", "));
    }

    // ── Resolve output folder ──────────────────────────────────────────
    var outFolder;
    if (picked.customFolder) {
        outFolder = new Folder(picked.customFolder);
    } else {
        outFolder = new Folder(docFolder.fsName + "/_layer_state_exports");
    }
    if (!outFolder.exists) outFolder.create();

    // ── File extension ─────────────────────────────────────────────────
    var fileExt = (picked.exportType === "jpeg") ? ".jpg" : ".png";

    // ── Check for existing files ───────────────────────────────────────
    var scales = picked.scales;
    var willOverwrite = [];
    for (var t = 0; t < picked.toggle.length; t++) {
        for (var s = 0; s < scales.length; s++) {
            var prefix      = picked.prefix ? cleanFileName(picked.prefix) + "_" : "";
            var scaleSuffix = (scales.length > 1 || scales[0] !== 1) ? "@" + scales[s] + "x" : "";
            var fName       = prefix + cleanFileName(picked.toggle[t]) + scaleSuffix + fileExt;
            var testFile    = new File(outFolder.fsName + "/" + fName);
            if (testFile.exists) willOverwrite.push(fName);
        }
    }

    var skipExisting = false;
    if (willOverwrite.length > 0) {
        var overwriteMsg = willOverwrite.length + " file(s) already exist:\n";
        if (willOverwrite.length <= 5) {
            overwriteMsg += willOverwrite.join("\n") + "\n\n";
        } else {
            overwriteMsg += willOverwrite.slice(0, 5).join("\n") + "\n...and " + (willOverwrite.length - 5) + " more.\n\n";
        }
        overwriteMsg += "Overwrite all?  (Cancel = skip existing)";
        skipExisting = !confirm(overwriteMsg);
    }

    // ── Save original visibility ───────────────────────────────────────
    var originalVisibility = {};
    for (var v = 0; v < doc.layers.length; v++) {
        originalVisibility[doc.layers[v].name] = doc.layers[v].visible;
    }

    // ── Export loop ────────────────────────────────────────────────────
    var exported = 0;
    var skipped  = 0;

    for (var t = 0; t < picked.toggle.length; t++) {
        hideAllLayers(doc);
        setLayersVisible(doc, picked.alwaysOn, true);
        setLayersVisible(doc, [picked.toggle[t]], true);

        for (var s = 0; s < scales.length; s++) {
            var scale       = scales[s];
            var prefix      = picked.prefix ? cleanFileName(picked.prefix) + "_" : "";
            var scaleSuffix = (scales.length > 1 || scale !== 1) ? "@" + scale + "x" : "";
            var fileName    = prefix + cleanFileName(picked.toggle[t]) + scaleSuffix + fileExt;
            var file        = new File(outFolder.fsName + "/" + fileName);

            if (skipExisting && file.exists) { skipped++; continue; }

            if (picked.exportType === "jpeg") {
                var opts          = new ExportOptionsJPEG();
                opts.antiAliasing    = true;
                opts.artBoardClipping = true;
                opts.horizontalScale = scale * 100;
                opts.verticalScale   = scale * 100;
                opts.qualitySetting  = picked.jpegQuality;
                doc.exportFile(file, ExportType.JPEG, opts);
            } else {
                var opts             = new ExportOptionsPNG24();
                opts.antiAliasing    = true;
                opts.transparency    = (picked.exportType === "png_alpha");
                opts.artBoardClipping = true;
                opts.horizontalScale = scale * 100;
                opts.verticalScale   = scale * 100;
                doc.exportFile(file, ExportType.PNG24, opts);
            }
            exported++;
        }
    }

    restoreVisibility(doc, originalVisibility);

    // ── Summary ────────────────────────────────────────────────────────
    var summary = "Done.\nExported " + exported + " file(s)";
    if (skipped > 0) summary += ", skipped " + skipped;
    summary += "\nTo:\n" + outFolder.fsName;
    alert(summary);

    if (picked.revealFolder) outFolder.execute();


    // ═════════════════════════════════════════════════════════════════
    //  DIALOG
    // ═════════════════════════════════════════════════════════════════
    function showLayerDialog(layerNames, docBaseName) {
        var win = new Window("dialog", "Render Layer States");
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;

        // ── Info ──────────────────────────────────────────────────────
        var info = win.add("statictext", undefined,
            "Always ON layers stay visible in every export. Toggle layers export one at a time.");
        info.alignment = ["fill", "top"];

        // ── File Name Prefix ──────────────────────────────────────────
        var prefixPanel = win.add("panel", undefined, "File Name Prefix");
        prefixPanel.orientation = "column";
        prefixPanel.alignChildren = ["fill", "top"];
        prefixPanel.margins = [10, 15, 10, 10];

        var prefixRg = prefixPanel.add("group");
        prefixRg.orientation = "column";
        prefixRg.alignChildren = ["left", "top"];
        prefixRg.spacing = 6;

        var radioFileName = prefixRg.add("radiobutton", undefined, "Use current file name  (" + docBaseName + ")");
        var radioCustom   = prefixRg.add("radiobutton", undefined, "Use custom prefix:");
        var radioNone     = prefixRg.add("radiobutton", undefined, "No prefix");
        radioFileName.value = true;

        var customInput = prefixPanel.add("edittext", undefined, "");
        customInput.preferredSize = [380, 22];
        customInput.enabled = false;

        radioFileName.onClick = function () { customInput.enabled = false; };
        radioNone.onClick     = function () { customInput.enabled = false; };
        radioCustom.onClick   = function () { customInput.enabled = true; customInput.active = true; };

        // ── Export Format ─────────────────────────────────────────────
        var fmtPanel = win.add("panel", undefined, "Export Format");
        fmtPanel.orientation = "column";
        fmtPanel.alignChildren = ["fill", "top"];
        fmtPanel.margins = [10, 15, 10, 10];

        var fmtRow = fmtPanel.add("group");
        fmtRow.orientation = "row";
        fmtRow.alignChildren = ["left", "center"];
        fmtRow.spacing = 20;

        var radioPNGAlpha = fmtRow.add("radiobutton", undefined, "PNG + Alpha");
        var radioPNGFlat  = fmtRow.add("radiobutton", undefined, "PNG no Alpha");
        var radioJPEG     = fmtRow.add("radiobutton", undefined, "JPEG");
        radioPNGAlpha.value = true;

        var jpegRow = fmtPanel.add("group");
        jpegRow.orientation = "row";
        jpegRow.alignChildren = ["left", "center"];
        jpegRow.spacing = 8;

        var jpegLabel     = jpegRow.add("statictext", undefined, "Quality (1–100):");
        var jpegQualInput = jpegRow.add("edittext", undefined, "85");
        jpegQualInput.preferredSize = [50, 22];
        jpegLabel.enabled     = false;
        jpegQualInput.enabled = false;

        radioPNGAlpha.onClick = function () { jpegLabel.enabled = false; jpegQualInput.enabled = false; };
        radioPNGFlat.onClick  = function () { jpegLabel.enabled = false; jpegQualInput.enabled = false; };
        radioJPEG.onClick     = function () { jpegLabel.enabled = true;  jpegQualInput.enabled = true; jpegQualInput.active = true; };

        // ── Export Resolution ─────────────────────────────────────────
        var scalePanel = win.add("panel", undefined, "Export Resolution");
        scalePanel.orientation = "row";
        scalePanel.alignChildren = ["left", "center"];
        scalePanel.margins = [10, 15, 10, 10];
        scalePanel.spacing = 16;

        var cb1x = scalePanel.add("checkbox", undefined, "1x");
        var cb2x = scalePanel.add("checkbox", undefined, "2x");
        var cb3x = scalePanel.add("checkbox", undefined, "3x");
        cb1x.value = true;

        var scaleNote = scalePanel.add("statictext", undefined, "  (@2x, @3x suffix added automatically)");
        scaleNote.enabled = false;

        // ── Output Folder ─────────────────────────────────────────────
        var folderPanel = win.add("panel", undefined, "Output Folder");
        folderPanel.orientation = "column";
        folderPanel.alignChildren = ["fill", "top"];
        folderPanel.margins = [10, 15, 10, 10];

        var folderRg = folderPanel.add("group");
        folderRg.orientation = "column";
        folderRg.alignChildren = ["left", "top"];
        folderRg.spacing = 6;

        var radioDefaultFolder = folderRg.add("radiobutton", undefined, "Default  (_layer_state_exports/ beside .ai file)");
        var radioCustomFolder  = folderRg.add("radiobutton", undefined, "Choose folder...");
        radioDefaultFolder.value = true;

        var folderPathGroup = folderPanel.add("group");
        folderPathGroup.orientation = "row";
        folderPathGroup.alignChildren = ["left", "center"];

        var folderPathLabel = folderPathGroup.add("statictext", undefined, "No folder selected");
        folderPathLabel.preferredSize = [310, 18];
        folderPathLabel.enabled = false;

        var browseBtn = folderPathGroup.add("button", undefined, "Browse…");
        browseBtn.enabled = false;
        var selectedFolder = null;

        radioDefaultFolder.onClick = function () {
            browseBtn.enabled = false;
            folderPathLabel.text = "No folder selected";
            folderPathLabel.enabled = false;
            selectedFolder = null;
        };
        radioCustomFolder.onClick = function () {
            browseBtn.enabled = true;
            folderPathLabel.enabled = true;
        };
        browseBtn.onClick = function () {
            var f = Folder.selectDialog("Choose export folder");
            if (f) { selectedFolder = f.fsName; folderPathLabel.text = f.fsName; }
        };

        // ── Layer lists ───────────────────────────────────────────────
        var listsGroup = win.add("group");
        listsGroup.orientation = "row";
        listsGroup.alignChildren = ["fill", "top"];
        listsGroup.spacing = 10;

        // Always ON ── green tint panel
        var leftCol = listsGroup.add("group");
        leftCol.orientation = "column";
        leftCol.alignChildren = ["fill", "top"];
        leftCol.spacing = 4;

        var leftPanel = leftCol.add("panel", undefined, "Always ON");
        leftPanel.orientation = "column";
        leftPanel.alignChildren = ["fill", "fill"];
        var lg = leftPanel.graphics;
        leftPanel.graphics.backgroundColor = lg.newBrush(lg.BrushType.SOLID_COLOR, [0.14, 0.26, 0.16, 1]);

        var alwaysList = leftPanel.add("listbox", undefined, layerNames, { multiselect: true });
        alwaysList.preferredSize = [230, 280];
        var alg = alwaysList.graphics;
        alwaysList.graphics.backgroundColor = alg.newBrush(alg.BrushType.SOLID_COLOR, [0.09, 0.09, 0.09, 1]);

        var leftBtns = leftCol.add("group");
        leftBtns.orientation = "row";
        leftBtns.alignment = ["fill", "top"];
        var alwaysAllBtn  = leftBtns.add("button", undefined, "All");
        var alwaysNoneBtn = leftBtns.add("button", undefined, "None");
        alwaysAllBtn.preferredSize  = [60, 22];
        alwaysNoneBtn.preferredSize = [60, 22];

        alwaysAllBtn.onClick = function () {
            for (var i = 0; i < alwaysList.items.length; i++) alwaysList.items[i].selected = true;
        };
        alwaysNoneBtn.onClick = function () {
            for (var i = 0; i < alwaysList.items.length; i++) alwaysList.items[i].selected = false;
        };

        // Toggle / Export ── blue tint panel
        var rightCol = listsGroup.add("group");
        rightCol.orientation = "column";
        rightCol.alignChildren = ["fill", "top"];
        rightCol.spacing = 4;

        var rightPanel = rightCol.add("panel", undefined, "Toggle / Export States");
        rightPanel.orientation = "column";
        rightPanel.alignChildren = ["fill", "fill"];
        var rpg = rightPanel.graphics;
        rightPanel.graphics.backgroundColor = rpg.newBrush(rpg.BrushType.SOLID_COLOR, [0.14, 0.18, 0.30, 1]);

        var toggleList = rightPanel.add("listbox", undefined, layerNames, { multiselect: true });
        toggleList.preferredSize = [230, 280];
        var tg = toggleList.graphics;
        toggleList.graphics.backgroundColor = tg.newBrush(tg.BrushType.SOLID_COLOR, [0.09, 0.09, 0.09, 1]);

        var rightBtns = rightCol.add("group");
        rightBtns.orientation = "row";
        rightBtns.alignment = ["fill", "top"];
        var toggleAllBtn  = rightBtns.add("button", undefined, "All");
        var toggleNoneBtn = rightBtns.add("button", undefined, "None");
        toggleAllBtn.preferredSize  = [60, 22];
        toggleNoneBtn.preferredSize = [60, 22];

        toggleAllBtn.onClick = function () {
            for (var i = 0; i < toggleList.items.length; i++) toggleList.items[i].selected = true;
        };
        toggleNoneBtn.onClick = function () {
            for (var i = 0; i < toggleList.items.length; i++) toggleList.items[i].selected = false;
        };

        // ── Options row ───────────────────────────────────────────────
        var optRow = win.add("group");
        optRow.orientation = "row";
        optRow.alignChildren = ["left", "center"];
        var revealChk = optRow.add("checkbox", undefined, "Reveal output folder when done");
        revealChk.value = true;

        // ── Buttons ───────────────────────────────────────────────────
        var btnGroup = win.add("group");
        btnGroup.orientation = "row";
        btnGroup.alignment = ["right", "bottom"];
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");
        var okBtn     = btnGroup.add("button", undefined, "Export", { name: "ok" });

        cancelBtn.onClick = function () { win.close(0); };
        okBtn.onClick     = function () { win.close(1); };

        var result = win.show();
        if (result !== 1) return null;

        // Resolve prefix
        var prefix = "";
        if (radioFileName.value)    { prefix = docBaseName; }
        else if (radioCustom.value) { prefix = customInput.text; }

        // Resolve scales
        var scales = [];
        if (cb1x.value) scales.push(1);
        if (cb2x.value) scales.push(2);
        if (cb3x.value) scales.push(3);
        if (scales.length === 0) scales = [1];

        // Resolve folder
        var customFolder = null;
        if (radioCustomFolder.value && selectedFolder) customFolder = selectedFolder;

        // Resolve export format
        var exportType  = "png_alpha";
        var jpegQuality = 85;
        if (radioPNGFlat.value) {
            exportType = "png";
        } else if (radioJPEG.value) {
            exportType  = "jpeg";
            jpegQuality = parseInt(jpegQualInput.text, 10) || 85;
            jpegQuality = Math.min(100, Math.max(1, jpegQuality));
        }

        return {
            alwaysOn     : getSelectedNames(alwaysList),
            toggle       : getSelectedNames(toggleList),
            prefix       : prefix,
            scales       : scales,
            customFolder : customFolder,
            revealFolder : revealChk.value,
            exportType   : exportType,
            jpegQuality  : jpegQuality
        };
    }

    // ═════════════════════════════════════════════════════════════════
    //  HELPERS
    // ═════════════════════════════════════════════════════════════════
    function getSelectedNames(listbox) {
        var result = [];
        if (!listbox.selection) return result;
        if (listbox.selection instanceof Array) {
            for (var i = 0; i < listbox.selection.length; i++) result.push(listbox.selection[i].text);
        } else {
            result.push(listbox.selection.text);
        }
        return result;
    }

    function hideAllLayers(doc) {
        for (var i = 0; i < doc.layers.length; i++) doc.layers[i].visible = false;
    }

    function setLayersVisible(doc, names, state) {
        for (var i = 0; i < names.length; i++) {
            var lyr = getLayerByName(doc, names[i]);
            if (lyr) lyr.visible = state;
        }
    }

    function restoreVisibility(doc, originalVisibility) {
        for (var i = 0; i < doc.layers.length; i++) {
            var lyr = doc.layers[i];
            if (originalVisibility.hasOwnProperty(lyr.name)) lyr.visible = originalVisibility[lyr.name];
        }
    }

    function getLayerByName(doc, name) {
        for (var i = 0; i < doc.layers.length; i++) {
            if (doc.layers[i].name === name) return doc.layers[i];
        }
        return null;
    }

    function cleanFileName(name) {
        return name.replace(/[\\\/:*?"<>|]/g, "_");
    }

})();
