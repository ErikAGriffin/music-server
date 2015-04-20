describe('Arriving at Landing Page', function() {


  beforeEach(function() {
    browser.get('http://localhost:3000/');
  });

  it("Has the title 'Music Server'", function() {
    expect(browser.getTitle()).toEqual('Music Server');
  });

  it("Can search Soundcloud songs", function() {



  });




});
