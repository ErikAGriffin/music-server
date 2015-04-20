describe('Adding music to Server', function() {

  var searchAndWait = function() {
    var searchBox = element(by.model('clientCtrl.searchText'));
    var submit = element(by.css('input[type=submit]'));
    searchBox.sendKeys('David Who Subtle Motion');
    submit.click();
    browser.wait(element(by.css('.song-title')).isPresent());
  };

  beforeEach(function() {
    brower.get('http://localhost:3000/');
  });

  it('Can add a song to the server', function() {
    searchAndWait();
    var addSongButton = element.all(by.repeater('song in clientCtrl.searchResults')).get(0).element(by.linkText('Add Song'));
    addSongButton.click();
    browser.get('http://localhost:3000/server/');

  });





});