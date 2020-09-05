/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export default class AsyncIterableEmitter<T> implements AsyncIterableIterator<T> {
  constructor(
    timeout?: number
  ) {
    this.#timeout = timeout
  }

  readonly #timeout?: number

  #timer?: ReturnType<typeof setTimeout>

  #resolve?: (value: T | PromiseLike<T>) => void;

  #reject?: (error?: unknown) => void;

  #promise?: Promise<IteratorResult<T>>

  /**
   * emit next value to waiting iterators
   */
  public emit(value: T | PromiseLike<T>): void {
    const resolve = this.#resolve

    if (resolve) {
      resolve(value)

    }
  }

  /**
   * dispose every iterator waiting for next value resulting in its completion
   */
  public dispose(): void {
    const timer = this.#timer
    if (typeof timer !== 'undefined') {
      clearTimeout(timer)
    }
    this.#timer = undefined

    const reject = this.#reject
    if (typeof reject !== 'undefined') {
      reject()
    }
    this.#reject = undefined

    this.#resolve = undefined

    this.#promise = undefined
  }

  public next(): Promise<IteratorResult<T>> {
    if (typeof this.#promise === 'undefined') {
      this.#promise = new Promise<T>(
        (resolve, reject) => {
          this.#resolve = resolve
          this.#reject = reject
          if (typeof this.#timeout === 'number') {
            this.#timer = setTimeout(reject, this.#timeout)
          }
        }
      ).then(
        (value): IteratorResult<T> => {
          this.dispose()

          return {
            value,
            done: false,
          }
        },
        (): IteratorResult<T> => {
          this.dispose()

          return {
            value: undefined,
            done: true,
          }
        },
      )
    }

    return this.#promise
  }

  public [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this;
  }
}
