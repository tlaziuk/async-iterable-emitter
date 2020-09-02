/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export default class AsyncIterableEmitter<T> implements AsyncIterable<T> {
  constructor(
    timeout?: number
  ) {
    this.#timeout = timeout
    this.#listeners = new Set()
    this.#disposes = new Set()
  }

  /**
   * emit next value to waiting iterators
   */
  public emit(value: T): void {
    for (const listener of this.#listeners) {
      listener(value)
    }
  }

  /**
   * dispose every iterator waiting for next value resulting in its completion
   */
  public dispose(): void {
    for (const dispose of this.#disposes) {
      dispose()
    }
  }

  readonly #timeout?: number

  readonly #listeners: Set<(value: T) => void>

  public get listenersCount() {
    return this.#listeners.size
  }

  readonly #disposes: Set<() => void>

  public get disposesCount() {
    return this.#disposes.size
  }

  public [Symbol.asyncIterator](): AsyncIterator<T, void, void> {
    const timeout = this.#timeout
    let promise: Promise<IteratorResult<T, void>> | undefined;
    let dispose: (() => void) | undefined;
    let done: boolean | undefined;

    const next = (): Promise<IteratorResult<T, void>> => {
      if (typeof promise === 'undefined') {
        promise = new Promise<T>(
          (resolve, reject) => {

            if (done) {
              reject()
              return
            }

            this.#listeners.add(resolve)

            let timer: NodeJS.Timeout | undefined

            const currentDispose = dispose = (): void => {
              promise = undefined
              this.#listeners.delete(resolve)
              this.#disposes.delete(currentDispose)
              if (typeof timer !== 'undefined') {
                clearTimeout(timer)
                timer = undefined
              }
              reject()
            }

            this.#disposes.add(currentDispose)

            if (typeof timeout === 'number') {
              timer = setTimeout(currentDispose, timeout)
            }
          }
        ).then(
          (value): IteratorResult<T, void> => {
            if (dispose) {
              dispose()
            }

            done = false

            return {
              value,
              done,
            }
          },
          (): IteratorResult<T, void> => {
            if (dispose) {
              dispose()
            }

            done = true;

            return {
              value: undefined,
              done,
            }
          }
        )
      }

      return promise
    }

    return {
      next,
      return: () => {
        if (dispose) {
          dispose()
        }

        done = true

        return Promise.resolve({
          done,
          value: undefined
        })
      }
    }
  }
}
