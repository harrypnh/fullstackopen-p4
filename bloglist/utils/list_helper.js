const blog = require("../models/blog")

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  let likes = 0
  blogs.forEach((blog) => likes += blog.likes)
  return likes
}

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return {}
  }
  const maxLikes = Math.max(...blogs.map(blog => blog.likes))
  const favoriteBlogs = blogs.filter(blog => blog.likes === maxLikes)
  return {
    title: favoriteBlogs[0].title,
    author: favoriteBlogs[0].author,
    likes: favoriteBlogs[0].likes
  }
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return {}
  }
  const authors = [...new Set(blogs.map(blog => blog.author))]
  var totalBlogsByAuthors = []
  authors.forEach(author => {
    totalBlogsByAuthors.push({
      author: author,
      blogs: blogs.filter(blog => blog.author === author).length
    })
  })
  const maxBlogs = Math.max(...totalBlogsByAuthors.map(totalBlogs => totalBlogs.blogs))
  return totalBlogsByAuthors.filter(totalBlogs => totalBlogs.blogs === maxBlogs)[0]
}

const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return {}
  }
  const authors = [...new Set(blogs.map(blog => blog.author))]
  var likesByAuthors = []
  authors.forEach(author => {
    let likes = 0
    blogs.filter(blog => blog.author === author)
      .forEach(blog => likes += blog.likes)
    likesByAuthors.push({
      author: author,
      likes: likes
    })
  })
  const maxLikes = Math.max(...likesByAuthors.map(likesByAuthor => likesByAuthor.likes))
  return likesByAuthors.filter(likesByAuthor => likesByAuthor.likes === maxLikes)[0]
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}