describe('Arriving at Landing Page', function() {


  beforeEach(function() {
    browser.get('http://localhost:3000/');
  });

  it("Has the title 'Music Server'", function() {
    expect(browser.getTitle()).toEqual('Music Server');
  });

  it("Can search Soundcloud songs", function() {
    var searchBox = element(by.model('clientCtrl.searchText'));
    var submit = element(by.css('input[type=submit]'));
    searchBox.sendKeys('David Who Subtle Motion');
    submit.click();
    var results = element.all(by.repeater('song in clientCtrl.searchResults'));
    expect(results.get(0).element(by.css('.song-title')).getText()).toEqual('David Who - Subtle Motion');
  });




});
