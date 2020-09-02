import AsyncIterableEmitter from './index'

describe(AsyncIterableEmitter, () => {
  it('should be able to create instance', () => {
    expect(new AsyncIterableEmitter()).toBeInstanceOf(AsyncIterableEmitter)
  })

  it('should be able to get single value', async () => {
    const emitter = new AsyncIterableEmitter<unknown>()

    const iterator = emitter[Symbol.asyncIterator]()

    const valuePromise = iterator.next()

    emitter.emit(1)

    expect((await valuePromise).value).toEqual(1)
  }, 1_000)

  it('should be able to get subsequent values', async () => {
    const emitter = new AsyncIterableEmitter<unknown>()

    const iterator = emitter[Symbol.asyncIterator]()

    const promiseOne = iterator.next()

    emitter.emit(1)

    expect((await promiseOne).value).toEqual(1)

    const promiseTwo = iterator.next()

    emitter.emit(2)

    expect((await promiseTwo).value).toEqual(2)

    const promiseThree = iterator.next()

    emitter.emit(3)

    expect((await promiseThree).value).toEqual(3)
  }, 1_000)

  it('should be able to get multiple values at the same time', async () => {
    const emitter = new AsyncIterableEmitter<unknown>()

    const iterator = emitter[Symbol.asyncIterator]()

    const promiseOne = iterator.next()
    const promiseTwo = iterator.next()

    expect(emitter.disposesCount).toEqual(1)
    expect(emitter.listenersCount).toEqual(1)

    emitter.emit(1)

    expect((await promiseOne).value).toEqual(1)
    expect((await promiseTwo).value).toEqual(1)

    expect(emitter.disposesCount).toEqual(0)
    expect(emitter.listenersCount).toEqual(0)
  }, 1_000)

  it('should be able to use in for-await-of loop', async () => {
    const emitter = new AsyncIterableEmitter<unknown>(50)

    setTimeout(
      () => {
        emitter.emit(0)
        emitter.emit(1)
        emitter.emit(2)
        emitter.emit(3)
      },
      10,
    )

    let index = 0
    for await (const value of emitter) {
      expect(value).toEqual(index++)
    }

    expect(emitter.disposesCount).toEqual(0)
    expect(emitter.listenersCount).toEqual(0)
  }, 1_000)

  it('should be able to use in for-await-of loop with delay', async () => {
    const emitter = new AsyncIterableEmitter<unknown>(50)

    setTimeout(
      () => {
        emitter.emit(1)
      },
      10,
    )

    setTimeout(
      () => {
        emitter.emit(2)
      },
      20,
    )

    setTimeout(
      () => {
        emitter.emit(3)
      },
      30,
    )

    setTimeout(
      () => {
        emitter.emit(4)
      },
      40,
    )

    setTimeout(
      () => {
        emitter.emit(5)
      },
      50,
    )

    let index = 1
    for await (const value of emitter) {
      expect(value).toEqual(index++)
    }

    expect(emitter.disposesCount).toEqual(0)
    expect(emitter.listenersCount).toEqual(0)
  }, 1_000)

  it('should calling dispose resulting in finishing the iterator', async () => {
    const emitter = new AsyncIterableEmitter<unknown>()

    const iterator = emitter[Symbol.asyncIterator]()

    const nextPromise = iterator.next()

    emitter.dispose()

    expect((await nextPromise).done).toEqual(true)
  })

  it('should calling iterator return result in not emitting subsequent values', async () => {
    const emitter = new AsyncIterableEmitter<unknown>()

    const iterator = emitter[Symbol.asyncIterator]()

    const nextPromise = iterator.next()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const returnPromise = iterator.return!()

    expect((await nextPromise).done).toEqual(true)
    expect((await returnPromise).done).toEqual(true)
  })

  it('should iterator not interfere with another iterator', async () => {
    const emitter = new AsyncIterableEmitter<unknown>()

    const iteratorOne = emitter[Symbol.asyncIterator]()

    const iteratorTwo = emitter[Symbol.asyncIterator]()

    const nextOnePromise = iteratorOne.next()

    const nextTwoPromise = iteratorTwo.next()

    expect(emitter.disposesCount).toEqual(2)
    expect(emitter.listenersCount).toEqual(2)

    emitter.emit(0)

    expect((await nextOnePromise).value).toEqual(0)
    expect((await nextTwoPromise).value).toEqual(0)

    expect(emitter.disposesCount).toEqual(0)
    expect(emitter.listenersCount).toEqual(0)
  })

  it('should be able to dispose multiple iterators', async () => {
    const emitter = new AsyncIterableEmitter<unknown>()

    const iteratorOne = emitter[Symbol.asyncIterator]()

    const iteratorTwo = emitter[Symbol.asyncIterator]()

    const nextOnePromise = iteratorOne.next()

    const nextTwoPromise = iteratorTwo.next()

    expect(emitter.disposesCount).toEqual(2)
    expect(emitter.listenersCount).toEqual(2)

    emitter.dispose()

    expect((await nextOnePromise).done).toEqual(true)
    expect((await nextTwoPromise).done).toEqual(true)

    expect(emitter.disposesCount).toEqual(0)
    expect(emitter.listenersCount).toEqual(0)
  })
})
