const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

const PASSWORD_MINLENGTH = 3

usersRouter.get('/', async (request, response) => {
  const users = await User
    .find({})
    .populate('blogs', {url: 1, title: 1, author: 1, id: 1})
  response.json(users)
})

usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body
  
  if (password === undefined) {
    return response.status(400).json({ error: 'User validation failed: password: Path `password` is required.' })
  }
  else if (password.length <= PASSWORD_MINLENGTH) {
    return response.status(400).json({ error: `User validation failed: password: Path \`password\` is shorter than the minimum allowed length (${PASSWORD_MINLENGTH}).` })
  }
  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash,
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)
})

usersRouter.delete('/:id', async (request, response) => {
  await User.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

module.exports = usersRouter