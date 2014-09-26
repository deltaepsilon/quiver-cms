module.exports = {
  active: function (href, url) {
    return href === url ? 'active' : '';
  }
};