var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;
var request = require('supertest-as-promised');
var feathers = require('feathers');
var _ = require('lodash');
var urlencode = require('urlencode');
var deleteStream = require('level-delete-stream');

var env = process.env.NODE_ENV || 'test';

var bob = {
  name: "Bob Loblaw",
  email: "bobloblawslawblog.com",
};

var aramis = {
  name: "Aramis",
  email: "aramis@3muskeeters.com"
};

var athos = {
  name: "Athos",
  email: "athos@3muskeeters.com"
};

var porthos = {
  name: "Porthos",
  email: "porthos$3muskeeters.com"
};

var checkPerson = function (actual, expected) {
  expect(actual).to.have.property("@id");
  expect(actual).to.have.property("@type", "Person");
  _.each(expected, function (value, key) {
    expect(actual).to.have.property(key, value);
  });
};

describe("#PersonService", function () {
  var types;
  var People;
  var memberships;
  var groups;
  var db;
  var app;

  before(function () {
    var level = require('level-test')();
    db = level(env+'.db');

    graphs = require('oa-graphs')({
      db: db,
      base: "http://open.app/",
    });

    People = graphs.use(
      require('oa-graphs/lib/People')
    );

    app = require('../')(graphs);

    request = request(app);
  });

  beforeEach(function (done) {
    return db.createKeyStream()
    .pipe(deleteStream(db, done))
  });

  it("should create Person", function () {
    var id;

    return request
    .post("/People")
    .send(bob)
    .expect("Content-Type", /json/)
    .expect(201)
    .then(function (res) {
      var person = res.body;
      expect(person['@context']).to.deep.equal(People.type.context());
      checkPerson(person, bob)
      id = person['@id'];
    })
    .then(function () {
      return People.get(id);
    })
    .then(function (person) {
      checkPerson(person, bob);
    })
    ;
  });

  it("should get all Persons", function () {

    return People.create(bob)
    .then(function () {
      return request
      .get("/People")
      .expect("Content-Type", /json/)
      .expect(200)
      ;
    })
    .then(function (res) {
      var people = res.body;
      expect(people).to.have.length(1);
      var person = people[0];
      expect(person['@context']).to.deep.equal(People.type.context());
      checkPerson(person, bob)
    })
    ;
  });

  it("should get a person", function () {

    return People.create(bob)
    .then(function (person) {
      return request
      .get("/People/" + urlencode(person['@id']))
      .expect(200)
      ;
    })
    .then(function (res) {
      var person = res.body;
      expect(person['@context']).to.deep.equal(People.type.context());
      checkPerson(person, bob)
    });
  });

  it("should update a person", function () {

    var newData = {
      name: "Bob Loblaw",
      email: "bobsnewemail@email.com",
    };

    return People.create(bob)
    .then(function (person) {
      return request
      .put("/People/" + urlencode(person['@id']))
      .send(newData)
      .expect(200)
      ;
    })
    .then(function (res) {
      var person = res.body;
      expect(person['@context']).to.deep.equal(People.type.context());
      checkPerson(person, newData)
    });
  });

  it("should delete a person", function () {
    var id;

    return People.create(bob)
    .then(function (person) {
      id = person['@id']

      // delete bob with api
      return request
      .delete("/People/" + urlencode(id))
      .expect(204)
      ;
    })
    .then(function (res) {
      // get deleted bob from database
      return People.get(id)
    })
    .then(function (person) {
      expect(person).to.deep.equal({});

      // get deleted bob from api
      return request
      .get("/People/" + urlencode(id))
      .expect(404)
      ;
    })
    ;
  });

  it("should batch create People", function () {
    // TODO
  });
});
