module.exports = function prepareThemes(grunt) {
  "use strict";

  var happyplan = grunt.config.getRaw('happyplan')
    , mergeConfig = require('./merge-config')
    , localConfigPath = happyplan.cwd + '/happyplan.json'

  if (grunt.file.exists(localConfigPath)) {
    happyplan = mergeConfig(localConfigPath, [], grunt)
  }

  var themes = require('./get-themes')(grunt)

  //grunt.verbose.writeln('Runtime config', happyplan)

  // load themes tasks
  for (var key in themes) {
    if (themes[key] && themes[key].path && themes[key].path.tasks) {
      grunt.loadTasks(themes[key].path.tasks)
    }
  }

  // prepare config for copy task for theme
  // by default, get default theme

  // all copy tasks
  happyplan.themesCopyTask = {}

    // all resources files {layouts..glyphicons}.src|dest used for watching
  var themeSrcDest_byRessources = {}
    // all copy tasks names by types (html|assets)
    , prepareBuild_Tasks = {}
    , availableFilesPerTheme = {
      "html": {
        "layouts": "<%= happyplan.path.build.html.layouts %>"
      },
      "assets": {
        "scripts": "<%= happyplan.path.build.assets.scripts %>",
        "images": "<%= happyplan.path.build.assets.images %>",
        "fonts": "<%= happyplan.path.build.assets.fonts %>"
      }
    }
  // here we (create tasks to) copy each themes files (in order: defaut, parent(s), local)
  // engine files. local are copied last to ovewrite previous files
  for (var themeKey in themes) {
    for(var objKey in availableFilesPerTheme) {
      if (!prepareBuild_Tasks[objKey]) {
        prepareBuild_Tasks[objKey] = [];
      }
      for(var filesKey in availableFilesPerTheme[objKey]) {
        if (themes[themeKey].path &&
            themes[themeKey].path[objKey] &&
            themes[themeKey].path[objKey][filesKey]) {
          var src = themes[themeKey].path[objKey][filesKey];
          var dest = availableFilesPerTheme[objKey][filesKey];
          if (!themeSrcDest_byRessources[filesKey]) {
            themeSrcDest_byRessources[filesKey] = {
              src: [],
              dest: dest // dest is always the same for each types
            };
          }
          themeSrcDest_byRessources[filesKey].src.push(src);
          var taskKey = 'th_' +themeKey + '-' + objKey + '--' + filesKey;
          happyplan.themesCopyTask[taskKey] = {files: [{
            expand: true,
            cwd: src,
            src: ['**'],
            dest: dest
          }]};
          prepareBuild_Tasks[objKey].push('copy:' + taskKey);
        }
      }
    }
  }

  // register preparation task for the entire html tree
  grunt.registerTask('happyplan:prepare-build-html', prepareBuild_Tasks.html);
  grunt.registerTask('happyplan:prepare-build-assets', prepareBuild_Tasks.assets);

  // clean theme paths
  // this done here because in files section using minimatch & exclude pattern,
  // paths not normalized don't match correctly
  // ex: include /bla/./bla/**/*, exclude /bla/./bla/**/_* don't work as expected
  var path = require('path')
  var cleanPath = function(themePaths) {
    ["html", "assets"].forEach(function(type) {
      if (themePaths[type]) {
        for (var childType in themePaths[type]) {
          themePaths[type][childType] = path.normalize(grunt.template.process(themePaths[type][childType], { data: { happyplan: happyplan}}));
        }
      }
    })
  }
  for (var thKey in happyplan.theme) {
    if (happyplan.theme[thKey] && happyplan.theme[thKey].path)
      cleanPath(happyplan.theme[thKey].path)
  }
  cleanPath(happyplan.path)
}
