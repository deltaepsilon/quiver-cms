//
//  Video Extensions
//  $[GOPR0093.MP4](https://s3.amazonaws.com/assets.saltlakecycles.com/cms/GOPR0093.MP4)
//
//  @username   ->  <a href="http://twitter.com/username">@username</a>
//  #hashtag    ->  <a href="http://twitter.com/search/%23hashtag">#hashtag</a>
//

//$[GOPR0093.MP4](https://s3.amazonaws.com/assets.saltlakecycles.com/cms/GOPR0093.MP4)

(function(){

  var video = function(converter) {
    return [

      // @username syntax
      // '\\B\\$(\\[[\\S]\\]+)\\(.+?\\)\\b'
      { type: 'lang',
        regex: '\\!\\!\\[(\\S+)\\]\\((\\S+)\\)',
        replace: function(match, name, uri) {
          // Check if we matched the leading \ and return nothing changed if so
          return '<video alt="' + name + '" src="' + uri + '" controls></video>';

        }
      }
    ];
  };

  // Client-side export
  if (typeof window !== 'undefined' && window.Showdown && window.Showdown.extensions) { window.Showdown.extensions.video = video; }
  // Server-side export
  if (typeof module !== 'undefined') module.exports = video;

}());
