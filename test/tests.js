const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const {app, runServer, closeServer} = require('../server');
const {BlogPost} = require('../models');

const should = chai.should();

chai.use(chaiHttp);

function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err))
  });
}

function seedBlogPostData() {
  console.info('seeding blog post data');
  const seedData = [];
  for (let i=1; i<=10; i++) {
    seedData.push({
      author: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      },
      title: faker.lorem.sentence(),
      content: faker.lorem.text()
    });
  }
  // returns a promise
  return BlogPost.insertMany(seedData);
}



describe('API resource', function() {

  before(function() {
    return runServer();
  });

  beforeEach(function() {
    return seedBlogPostData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  //GET TEST
  describe('GET endpoint', function() {

  it('should return existing blogs', function(){
  	let res;
  	return chai.request(app)
      .get('/posts')
      .then(_res) {
      	res = res;
        res.should.have.status(200);
        res.body.should.have.length.of.at.least(1);
        return BlogPost.count();
    }
  		.then(count => {
  			res.body.should.have.length.of(count);
  		});
  	});


  //make sure fields match

  it('should return posts with right fields', function(){
  	let resPost;
    return chai.request(app)
      .get('/posts')
      .then(function(res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body.should.have.length.of.at.least(1);

        res.body.forEach(function(post) {
        	post.should.be.a('object');
        	post.should.include.keys('id', 'title', 'content', 'author', 'created');
        });

        resPost = res.body[0];
        return BlogPost.findById(resPost.id).exec();

        })

      .then(post => {
      	resPost.title.should.equal(post.title);
      	resPost.content.should.equal(post.content);
      	resPost.author.should.equal(post.authorName);
      });

      });
  });
 
  // POST TEST


describe('POST endpoint', function(){
	it('should add a new blog post with PUT', function() {
    const newPost = {
      title: faker.lorem.sentence(),
      author: {
      	firstName: faker.name.firstName(),
      	lastName: faker.name.lastName(),
      },
      content: faker.lorem.text()
    };

    return chai.request(app)
      .post('/posts')
      .send(newPost)
      .then(function(res) {
        res.should.have.status(200);
        res.should.be('json');
        res.body.should.be.a('object');
        res.body.should.include.keys('id', 'title', 'content', 'author', 'created');
        res.body.title.should.equal(newPost.title);
        res.body.id.should.not.be.null;
        res.body.author.should.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
        res.body.content.should.equal(newPost.content);
          return BlogPost.findById(res.body.id).exec();
        })
        .then(function(post) {
          post.title.should.equal(newPost.title);
          post.content.should.equal(newPost.content);
          post.author.firstName.should.equal(newPost.author.firstName);
          post.author.lastName.should.equal(newPost.author.lastName);
        });
    });
  });
      


   // PUT TEST

  describe('PUT', function() {
    it('should update fields', function() {
      const updateData = {
        title: 'cats cats cats',
        content: 'dogs dogs dogs',
        author: {
          firstName: 'foo',
          lastName: 'bar'
        }
      };
      return BlogPost
        .findOne()
        .exec()
        .then(post => {
          updateData.id = post.id;

          return chai.request(app)
            .put(`/posts/${post.id}`)
            .send(updateData);
        })
        .then(res => {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.title.should.equal(updateData.title);
          res.body.author.should.equal(
            `${updateData.author.firstName} ${updateData.author.lastName}`);
          res.body.content.should.equal(updateData.content);

          return BlogPost.findById(res.body.id).exec();
        })
        .then(post => {
          post.title.should.equal(updateData.title);
          post.content.should.equal(updateData.content);
          post.author.firstName.should.equal(updateData.author.firstName);
          post.author.lastName.should.equal(updateData.author.lastName);
        });
    });
  });

  describe('DELETE endpoint', function() {
    it('should delete a post by id', function() {
      let post;
      return BlogPost
        .findOne()
        .exec()
        .then(_post => {
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`);
        })
        .then(res => {
          res.should.have.status(204);
          return BlogPost.findById(post.id);
        })
        .then(_post => {
          should.not.exist(_post);
        });
    });
  });
});