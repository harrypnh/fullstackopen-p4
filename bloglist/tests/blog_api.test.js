const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const api = supertest(app)

let token = ''

beforeEach(async() => {
  await User.deleteMany({})
  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ username: 'root', passwordHash })
  const savedUser = await user.save()
  token = jwt.sign(
    {
      username: savedUser.username,
      id: savedUser._id
    },
    process.env.SECRET,
    { expiresIn: 60*60 }
  )
  await Blog.deleteMany({})
  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog(blog)
    blogObject.user = savedUser._id
    await blogObject.save()
  }
})

describe('when there are initially some blogs saved', () => {
  test('blog list returns the correct number of blogs in JSON', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('the unique identifier property of the blog posts is named id', async () => {
    const response = await api.get('/api/blogs')
    response.body.forEach(blog => expect(blog.id).toBeDefined())
  })
})

describe('addition of a new blog', () => {
  test('a valid blog can be added', async () => {
    const newBlog = {
      title: "Fast image construction in computerized axial tomography (CAT)",
      author: "Edsger W. Dijkstra",
      url: "https://www.cs.utexas.edu/users/EWD/transcriptions/EWD08xx/EWD810a.html",
      likes: 11,
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
  })

  test('returns 401 if the token is not provided', async () => {
    const newBlog = {
      title: "Fast image construction in computerized axial tomography (CAT)",
      author: "Edsger W. Dijkstra",
      url: "https://www.cs.utexas.edu/users/EWD/transcriptions/EWD08xx/EWD810a.html",
      likes: 11,
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)
  })

  test('0 like will be given when adding a blog without likes property', async () => {
    const newBlog = {
      title: "Fast image construction in computerized axial tomography (CAT)",
      author: "Edsger W. Dijkstra",
      url: "https://www.cs.utexas.edu/users/EWD/transcriptions/EWD08xx/EWD810a.html"
    }

    const response = await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    expect(response.body.likes).toBe(0)
  })

  test('returns 400 if the title property are missing', async () => {
    let newBlog = {
      author: "Edsger W. Dijkstra",
      url: "https://www.cs.utexas.edu/users/EWD/transcriptions/EWD08xx/EWD810a.html"
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
  })

  test('returns 400 if the url property are missing', async () => {
    let newBlog = {
      title: "Fast image construction in computerized axial tomography (CAT)",
      author: "Edsger W. Dijkstra"
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
  })

  test('returns 400 if the title and url properties are missing', async () => {
    let newBlog = {
      author: "Edsger W. Dijkstra"
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
  })
})

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)
    const titles = blogsAtEnd.map(r => r.title)
    expect(titles).not.toContain(blogToDelete.title)
  })

  test('fails with status code 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a344'

    await api
      .delete(`/api/blogs/${invalidId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
  })
})

describe('updating a specific note', () => {
  test('succeeds with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const blogToUpdate = blogsAtStart[0]
    blogToUpdate.likes += 1

    const resultBlog = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(blogToUpdate)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(resultBlog.body.likes).toEqual(blogToUpdate.likes)
  })

  test('fails with status code 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a344'

    await api
      .put(`/api/blogs/${invalidId}`)
      .expect(400)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})