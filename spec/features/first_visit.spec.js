describe('Arriving at Landing Page', function() {

  var searchAndWait = function() {
    var searchBox = element(by.model('clientCtrl.searchText'));
    var submit = element(by.css('input[type=submit]'));
    searchBox.sendKeys('David Who Subtle Motion');
    submit.click();
    browser.wait(element(by.css('.song-title')).isPresent());
  };



  beforeEach(function() {
    browser.get('http://localhost:3000/');
  });

  it("Has the title 'Music Server'", function() {
    expect(browser.getTitle()).toEqual('Music Server');
  });

  it("Can search Soundcloud songs", function() {
    searchAndWait();
    var results = element.all(by.repeater('song in clientCtrl.searchResults'));
    expect(results.get(0).element(by.css('.song-title')).getText()).toEqual('David Who - Subtle Motion');
  });

  it('Can add a song to the server', function() {
    searchAndWait();
    var addSongButton = element.all(by.repeater('song in clientCtrl.searchResults')).get(0).element(by.linkText('Add Song'));
    addSongButton.click();

  });





});
