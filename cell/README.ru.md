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

#### `compare`

Функция сравнения значений. Если `compare(oldValue, newValue)` вернет true, то значит значение не изменилось

#### `compareKey`

Выбор ключа, по которому сравнивать функцией compare, например `compareKey: x => x.Id`, не работает без compare

#### `filter`

Валидация значений. Если значение невалидное, вызывается `.setError`.

_"Почему вместо игнорирования невалидного значения фильтр формирует ошибку?"_ - потому что, например:

```typescript
const a = new Cell(1);
const b = new Cell(() => a.get(), {filter: x => x > 0});
a.set(-1);
console.log(b.get()); // здесь будет выброшена ошибка с описанием: "Cell have not accepted value: -1"
```

Изменилось значение ячейки `a`, при этом `b` зависит от `a` и тоже должно измениться, иначе `b` становится невалидным.  
Соответственно, нельзя просто проигнорировать изменение `a` только из-за того, что фильтр `b` не пропускает результат.  
Единственный выход - бросить ошибку.

_"Как же тогда быть? Мне нужны обычные фильтры, которые не бросают ошибку"_

```typescript
const a = new Cell(1);
const b = new Cell(() => a.get());

b.on('change', ({value}) => {
    if (value > 0)
        console.log(`b`, value);
});
```

1. Не использовать фильтр на ячейках
2. Логику фильтрации реализовать в подписке на интересующую ячейку.

#### `tap`

Вызывается после изменении значения ячейки, не активизируя ее.  
Можно использовать, например, для логирования.

#### `startValue`

Начальное значение. **Dangerous**, use it only if you understand clearly what you doing.
Just one good use-case is for initialize static value-cell. If you will use it with computed cells, they will not change its value never:
Cell have initial value, so pull have not executed and there is no dependencies.

### Актуализатор

[`cell.get()`](./docs/actualizator/actualizator.get.png)  
[`cell.set(value)`](./docs/actualizator/actualizator.set.png)

### Тесты для понимания:

* [Решение квадратного уравнения](./specs/long-graph.spec.ts)
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
