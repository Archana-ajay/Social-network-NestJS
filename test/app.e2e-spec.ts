import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';
import { User, UserSchema } from '../src/user/schema/user.schema';
import { Post, PostSchema } from '../src/post/schema/post.schema';
import { Connection, connect, Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as pactum from 'pactum';
import { LoginDto, RegisterDto } from 'src/user/dto';
import { postDto, updateDto } from 'src/post/dto';
import { profileDto } from 'src/profile/dto';
import { readFileSync } from 'fs';

describe('App e2e', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let userModel: Model<User>;
  let postModel: Model<Post>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    userModel = mongoConnection.model(User.name, UserSchema);
    postModel = mongoConnection.model(Post.name, PostSchema);
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      //controllers: [PostController, UserController, ProfileController],
      providers: [
        // PostService,
        // UserService,
        // ProfileService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Post.name), useValue: postModel },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3000);
    pactum.request.setBaseUrl('http://localhost:3000');
  });
  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();
    app.close();
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });
  describe('user', () => {
    const dto: RegisterDto = {
      email: 'testing2@gmail.com',
      name: 'test1',
      username: 'test1112',
      password: '12345671',
      password_confirmation: '12345671',
    };
    describe('register', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/user/register')
          .withBody({
            password: dto.password,
            name: dto.name,
            username: dto.username,
            password_confirmation: dto.password_confirmation,
          })
          .expectStatus(400);
      });
      it('should throw if password and password confirmation is empty', () => {
        return pactum
          .spec()
          .post('/user/register')
          .withBody({
            email: dto.email,
            name: dto.name,
            username: dto.username,
          })
          .expectStatus(400);
      });
      it('should throw if username empty', () => {
        return pactum
          .spec()
          .post('/user/register')
          .withBody({
            email: dto.email,
            password: dto.password,
            name: dto.name,
            password_confirmation: dto.password_confirmation,
          })
          .expectStatus(400);
      });
      it('should throw if no body provided', () => {
        return pactum.spec().post('/user/register').expectStatus(400);
      });
      it('should register', () => {
        return pactum
          .spec()
          .post('/user/register')
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('login', () => {
      const dto: LoginDto = {
        email: 'testing2@gmail.com',
        password: '12345671',
      };
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/user/login')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/user/login')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });
      it('should throw if no body provided', () => {
        return pactum.spec().post('/user/login').expectStatus(400);
      });
      it('should login', () => {
        return pactum
          .spec()
          .post('/user/login')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'token');
      });
    });
  });
  describe('Posts', () => {
    describe('Create post', () => {
      const dto: postDto = {
        description: 'this is a test post',
      };
      it('should create post', () => {
        return pactum
          .spec()
          .post('/posts/create')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('postId', '_id')
          .stores('user_name', 'user')
          .stores('userId', 'postedBy');
      });
    });

    describe('Get posts', () => {
      it('should get posts', () => {
        return pactum
          .spec()
          .get('/posts')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe('Get post by id', () => {
      it('should get post by id', () => {
        return pactum
          .spec()
          .get('/posts/{id}')
          .withPathParams('id', '$S{postId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBodyContains('$S{postId}');
      });
    });

    describe('Edit post by id', () => {
      const dto: updateDto = {
        description: 'description changed',
      };
      it('should edit post', () => {
        return pactum
          .spec()
          .patch('/posts/{id}')
          .withPathParams('id', '$S{postId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.description);
      });
    });

    describe('Delete post by id', () => {
      it('should delete post', () => {
        return pactum
          .spec()
          .delete('/posts/{id}')
          .withPathParams('id', '$S{postId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    });
  });
  describe('Profile', () => {
    describe('edit the  profile', () => {
      const dto: profileDto = {
        description: 'this is a edited status',
      };
      it('should edit profile', () => {
        return pactum
          .spec()
          .patch('/profile/{username}/edit')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .withPathParams('username', '$S{user_name}')
          .expectStatus(200);
      });
    });
    describe('get the  profile', () => {
      it('should get the profile', () => {
        return pactum
          .spec()
          .get('/profile/{username}/')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withPathParams('username', '$S{user_name}')
          .expectStatus(200);
      });
    });
    describe('follow the  profile', () => {
      it('should follow the profile', () => {
        return pactum
          .spec()
          .get('/profile/follow/{id}/')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withPathParams('id', '$S{userId}')
          .expectStatus(200);
      });
    });
    describe('unfollow the  profile', () => {
      it('should unfollow the profile', () => {
        return pactum
          .spec()
          .get('/profile/unfollow/{id}/')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withPathParams('id', '$S{userId}')
          .expectStatus(200);
      });
    });
  });
});
