'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:BulkUploadCtrl
 * @description
 * # BulkUploadCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('BulkUploadCtrl', function ($scope, $q, settingsRef, movementsRef, bodyFocusesRef, equipmentRef, exercisesRef, _, moment, Slug, NotificationService) {
    var settings = settingsRef.$asObject(),
      movements = movementsRef.$asArray(),
      bodyFocuses = bodyFocusesRef.$asArray(),
      equipment = equipmentRef.$asArray(),
      exercises = exercisesRef.$asArray(),
      clean = function (text) {
        var result = [],
          ROW_REGEX = /.+/g,
          COLUMN_REGEX = /[^\t]+/g;

        _.each(text.match(ROW_REGEX), function (row) {
          var columns = row.match(COLUMN_REGEX),
            column1Parts;

          if (!columns || !columns.length || !columns[1]) {
            return console.log('discarding row', row);
          }

          // Discard named rows
          column1Parts = columns[1].split(' ');

          if (columns[0].toLowerCase() === 'exercise name' || (column1Parts && column1Parts.length && column1Parts[0].toLowerCase() === 'level')) {
            return console.log('discarding first row', row);
          }

          result.push(columns);


        });
        return result;
      },
      isRange = function (value) {
        return value.split("-").length === 2;
      },
      isUrl = function (value) {
        return value.split("://").length === 2;
      },
      isRight = function (value) {
        return value ? value.toLowerCase() === 'right' : false;
      },
      getRange = function (value, index) {
        return parseInt(value.split('-')[index || 0]);
      },
      getMin = function (value) {
        return getRange(value, 0);
      },
      getMax = function (value) {
        return getRange(value, 1);
      };

    /*
     * Strength
     */

    $scope.importedStrength = [];

    $scope.importStrength = function (text) {
      var now = moment(),
        defaultExercise = {
          type: 'strength',
          title: 'Unnamed Exercise',
          slug: 'unnamed-exercise',
          bodyFocus: bodyFocuses[0].slug,
          equipment: equipment[0].slug,
          movement: movements[0].slug,
          levels: {
            one: true,
            two: true,
            three: true
          },
          created: now.format(),
          unix: now.unix()
        },
        defaultLevel = {
          reps: {
            min: 5,
            max: 10
          },
          video: {
            primary: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            secondary: "https://www.youtube.com/watch?v=dsUXAEzaC3Q"
          }
        },
        defaultRange = '5-10',
        rightSides = {},
        imports = [];

      _.each(clean(text), function (columns) {
        var exercise = _.clone(defaultExercise),
          right = isRight(columns[columns.length - 1]),
          defaultVideo = right ? defaultLevel.video.secondary : defaultLevel.video.primary;

        // Pad out columns with default data
        if (!isRange(columns[1])) {
          columns.splice(1, 0 , defaultRange);
        }

        if (!isUrl(columns[2])) {
          columns.splice(2, 0 , defaultVideo);
        }

        if (!isRange(columns[3])) {
          columns.splice(3, 0 , defaultRange);
        }

        if (!isUrl(columns[4])) {
          columns.splice(4, 0 , defaultVideo);
        }

        if (!isRange(columns[5])) {
          columns.splice(5, 0 , defaultRange);
        }

        if (!isUrl(columns[6])) {
          columns.splice(6, 0 , defaultVideo);
        }

        exercise.title = columns[0];
        exercise.slug = Slug.slugify(exercise.title);
        exercise.$priority = exercise.slug;

        var movement = _.findWhere(movements, {slug: Slug.slugify(columns[7])});
        exercise.movement = movement && movement.slug ? movement.slug : defaultExercise.movement;

        var bodyFocus = _.findWhere(bodyFocuses, {slug: Slug.slugify(columns[8])});
        exercise.bodyFocus = bodyFocus && bodyFocus.slug ? bodyFocus.slug : defaultExercise.bodyFocus;
        
        var equipment = _.findWhere(equipment, {slug: Slug.slugify(columns[9])});
        exercise.equipment = equipment && equipment.slug ? equipment.slug : defaultExercise.equipment;

        exercise.levels = {};
        _.each(columns[10].split(','), function (level) {
          switch (parseInt(level)) {
            case 1: 
              exercise.levels.one = true;
              break;
            case 2: 
              exercise.levels.two = true;
              break;
            case 3: 
              exercise.levels.three = true;
              break;
          }
          
        });

        exercise.levelOne = {
          reps: {
            min: getMin(columns[1]),
            max: getMax(columns[1])
          },
          video: {}
        };
        exercise.levelTwo = {
          reps: {
            min: getMin(columns[3]),
            max: getMax(columns[3])
          },
          video: {}
        };
        exercise.levelThree = {
          reps: {
            min: getMin(columns[5]),
            max: getMax(columns[5])
          },
          video: {}
        };

        if (right) {
          rightSides[exercise.slug] = {
            levelOne: {video: columns[2]},
            levelTwo: {video: columns[4]},
            levelThree: {video: columns[6]}
          }
        } else {
          exercise.levelOne.video.primary = columns[2];
          exercise.levelTwo.video.primary = columns[4];
          exercise.levelThree.video.primary = columns[6];
          imports.push(exercise);
        }

      });

      _.each(rightSides, function (rightSide, slug) {
        var exercise = _.findWhere(imports, {slug: slug});

        if (exercise) {
          exercise.levelOne.video.secondary = rightSide.levelOne.video;
          exercise.levelTwo.video.secondary = rightSide.levelTwo.video;
          exercise.levelThree.video.secondary = rightSide.levelThree.video;  
        } else {
          console.warn('Could not find ' + slug + '. Verify that there is a matching left-side exercise.');
        }
        
      });

      // _.each(imports, function (exercise) {
      //   console.log(exercise);
      // });

      $scope.strengthImports = imports;
      
    };

    $scope.importHiit = function (text) {
      var now = moment(),
        defaultExercise = {
          type: 'hiit',
          title: 'Unnamed Exercise',
          slug: 'unnamed-exercise',
          bodyFocus: bodyFocuses[0].slug,
          equipment: equipment[0].slug,
          level: 'one',
          standard: {
            reps: {}
          },
          long: {
            reps: {}
          },
          created: now.format(),
          unix: now.unix()
        },
        defaultLevel = {
          reps: {
            min: 5,
            max: 10
          },
          video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        },
        defaultRange = '20-30',
        imports = [];

      _.each(clean(text), function (columns) {
        var exercise = _.clone(defaultExercise),
          defaultVideo = defaultLevel.video;

        // Pad out columns with default data
        if (!isUrl(columns[1])) {
          columns.splice(1, 0 , defaultVideo);
        }

        if (!isRange(columns[2])) {
          columns.splice(2, 0 , defaultRange);
        }

        if (!isUrl(columns[3])) {
          columns.splice(3, 0 , defaultVideo);
        }

        if (!isRange(columns[4])) {
          columns.splice(4, 0 , defaultRange);
        }

        exercise.title = columns[0];
        exercise.slug = Slug.slugify(exercise.title);
        exercise.$priority = exercise.slug;

        var equipment = _.findWhere(equipment, {slug: Slug.slugify(columns[6])});
        exercise.equipment = equipment && equipment.slug ? equipment.slug : defaultExercise.equipment;

        var bodyFocus = _.findWhere(bodyFocuses, {slug: Slug.slugify(columns[7])});
        exercise.bodyFocus = bodyFocus && bodyFocus.slug ? bodyFocus.slug : defaultExercise.bodyFocus;

        switch (parseInt(columns[5])) {
          case 1: 
            exercise.level = 'one';
            break;
          case 2: 
            exercise.level = 'two';
            break;
          case 3: 
            exercise.level = 'three';
            break;
        }

        exercise.standard.reps.min = getMin(columns[2]);
        exercise.standard.reps.max = getMax(columns[2]);

        exercise.long.reps.min = getMin(columns[4]);
        exercise.long.reps.max = getMax(columns[4]);

        exercise.standard.video = columns[1];
        exercise.long.video = columns[3];
        
        imports.push(exercise);

      });

    $scope.hiitImports = imports;

    };

    $scope.importCardio = function (text) {
      var now = moment(),
        defaultExercise = {
          type: 'cardio',
          title: 'Unnamed Exercise',
          slug: 'unnamed-exercise',
          levelOne: {
            video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          },
          levelTwo: {
            video: "https://www.youtube.com/watch?v=C2xel6q0yao"
          },
          created: now.format(),
          unix: now.unix()
        },
        imports = [];

      _.each(clean(text), function (columns) {
        var exercise = _.clone(defaultExercise);

        exercise.title = columns[0];
        exercise.slug = Slug.slugify(exercise.title);
        exercise.$priority = exercise.slug;

        if (columns[1]) {
          exercise.levelOne.video = columns[1];  
        }

        if (columns[2]) {
          exercise.levelTwo.video = columns[2];  
        }
        
        imports.push(exercise);

      });

      $scope.cardioImports = imports;

    };

    /*
     * Manage imports
     */

    var removeImports = function (name) {
      return function (exercise) {
        var deferred = $q.defer(),
          i = $scope[name].length;

        while (i--) {
          if (exercise.slug === $scope[name][i].slug) {
            return deferred.resolve($scope[name].splice(i, 1));
            // $scope.$apply(function () {
            //   return deferred.resolve($scope[name].splice(i, 1));
            // });
            
          }
        }

        return deferred.promise;
      };
    };

    $scope.removeStrength = removeImports('strengthImports');
    $scope.removeHiit = removeImports('hiitImports');
    $scope.removeCardio = removeImports('cardioImports');

    var upload = function (name) {
      return function (exercise) {
        delete exercise.disabled;
        exercises.$add(exercise).then(function (ref) {
          removeImports(name)(exercise);
        }, function (err) {
          NotificationService.error('Upload Failed', exercise.title + "\n" + err);
        });
      };
    };

    $scope.uploadStrength = upload('strengthImports');
    $scope.uploadHiit = upload('hiitImports');
    $scope.uploadCardio = upload('cardioImports');

    var uploadAll = function (name) {
      var remove = removeImports(name);

      return function () {
        var uploadOne = function (exercise) {
          delete exercise.disabled;
          exercises.$add(exercise).then(function () {
            var i = $scope[name].length;

            while (i--) {
              if (exercise.slug === $scope[name][i].slug) {
                $scope[name].splice(i, 1);
                break;
              }
            }

            if ($scope[name].length) {
              uploadOne($scope[name][$scope[name].length - 1]);
            } else {
              NotificationService.success('Bulk Upload Succes!')
            }

          }, function (err) {
            NotificationService.error('Bulk Upload Failed', err); 
          });
        };

        if ($scope[name].length) {
          uploadOne($scope[name][$scope[name].length - 1]);  
        }

      };

    };

    $scope.uploadAllStrength = uploadAll('strengthImports');
    $scope.uploadAllHiit = uploadAll('hiitImports');
    $scope.uploadAllCardio = uploadAll('cardioImports');

  });
