require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const app = express()

app.use(express.static('dist'))
app.use(express.json())

morgan.token('body', (req) => {
  return req.method === 'POST' ? JSON.stringify(req.body) : '';
});

app.use(morgan(':method :url :status :res[content-length]  :response-time ms :body'));

const Persons = require('./model/persons')

const generateId = () => {
  const key = Math.random().toString(36).substring(2, 15);
  return key
}

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } 

  next(error)
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}


 app.post('/api/persons', (request, response) => {
  const body = request.body

  
   if (!body.name || !body.number) {
        return response.status(400).json({ 
          error: 'name or number missing' 
        })
      }
  
  const person = new Persons({
    name: body.name,
    number:body.number,
  })

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
})
app.get('/info', (request, response) => {
    const date = new Date()
    const totalPersons = Persons.length
    const info = `Phonebook has info for ${totalPersons} people<br>${date}`
    response.send(info)
  })

app.delete('/api/persons/:id', (request, response, next) => {
  Persons.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number} = request.body

  Persons.findById(request.params.id)
    .then(person => {
      if (!person) {
        return response.status(404).end()
      }

      person.content = name
      person.number = number

      return person.save().then((updatedPersons) => {
        response.json(updatedPersons)
      })
    })
    .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  Persons.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })

    .catch(error => next(error))
})
app.get('/api/persons', (request, response) => {
  Persons.find({}).then(person => {
    response.json(person)
  })
})
app.use(unknownEndpoint)
app.use(errorHandler)


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}/`)
  })