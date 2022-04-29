## Observable value store

Ячейка - контейнер для значения, позволяющий реагировать на изменения этого значения.

Ячейка хранит в себе либо значение либо ошибку, `cell.get()` либо возвращает это значение, либо выбрасывает ошибку.

### Два вида ячеек: 
* Значение `new Cell(x)`<br/>
  просто хранит в себе значение, можно его поменять `cell.set(y)`, можно задать ошибку `cell.setError(error)`
* Вычисляемая `new Cell(() => x)`:<br/>
  хранит в себе последнее вычисленное значение и обновляет его только когда изменятся ячейки, от которых она зависит.
  Для этого при каждом вычислении значения она запоминает ячейки, которые были опрошены и сохраняет их в список.
  Вычисляемой ячейке тоже можно задать значение, оно там будет храниться, пока не изменятся зависимости.

Изначально любая ячейка неактивная, т.к. от нее никто не зависит. 
Активация ячейки происходит, если подписались на изменения, или если другая активная ячейка стала зависеть от нее.
Активные ячейки сообщают о изменениях всем, кто от них зависит. 

### Настройки:
* compare - функция сравнения значений. Если `compare(oldValue, newValue)` вернет true, то значит значение не изменилось
* compareKey - выбор ключа, по которому сравнивать функцией compare, например `compareKey: x => x.Id`, не работает без compare
* filter - валидация значений. Если значение невалидное, вызывается `.setError`
* put - вызывается при изменении значения ячейки, не активизируя ее.
* value - начальное значение

### Тесты для понимания:
* [Решение квадратного уравнения](./spec/long-graph.spec.ts)
* [Декораторы](./specs/decorators.spec.ts)
* [Валидация](./specs/filter.spec.ts)
* [Функция сравнения](./specs/compare.spec.ts)
* [Асинхронная ячейка](./specs/async-cell.spec.ts)

### Examples

Here is a class with some observable fields:

```typescript
class TestObject {
    @cell
    public Value = 1;

    @cell({filter: x => !!x})
    public NotNull = null;

    @cell
    public get Computed(): number {
        return this.Value + 1;
    }

    public set Computed(x) {
    }

    @cell
    public getComputed() {
        return this.Computed * this.NotNull;
    }
}
```

1. Value - just store for a number. You can set it: `t.Value = 2` and get it: `console.log(t.Value)`
2. NotNull - like Value but it does not like any falsy values. It will throw error when readed
3. Computed - returns a Value+1. If you call `t.Computed = 4` it will be 4 until t.Value will not change
4. getComputed() - just returns a result of function

On every this field/method you can subscribe with new Cell: 
```
const t = new TestObject();
const cell = new Cell(() => t.Computed);
cell.on('change', x => console.log('computed is ', x));  
```
But you rarely should use this, it's better use wrappers for your UI library, for example [@cmmn/ui](../ui) 