describe('Starting a Server', function() {


  beforeAll(function() {
    browser.get('http://localhost:3000/');
  });

  it('A server can be started', function() {
    var serverLink = element(by.linkText('serve.musicserver.com'));
    serverLink.click();
    expect(element(by.id('')).getText()).toEqual('FE19B');

  });


});