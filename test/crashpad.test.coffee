crashpad = require '..'

describe 'crashpad', ->
  it 'works', ->
    throw new Error 'busted'
