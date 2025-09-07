import {AsyncCell, bind, Cell, cell, inject, resolve, scoped} from "@cmmn/core";
import {CounterRepository} from "./counter-repository";
import {DraggableContext} from "../draggable/draggable.context";
import {CRDT} from "@cmmn/sync";

@scoped()
export class CountersController {

	@inject(CounterRepository)
	protected repository!: CounterRepository;
	draggableContext = resolve(DraggableContext);

	readonly docQuery = AsyncCell.query(() => {
		return this.repository.loadDoc(this.id);
	});

	constructor(private id: string) {
		Cell.OnChange(() => this.draggableContext.hovered, hover => {
			if (hover.value.length == 1){
				const array = this.counters.toArray();
				const from = array.indexOf(this.draggableContext.draggableData);
				const to = array.indexOf(this.draggableContext.hovered[0]);
				this.counters.move(from, to);
				console.log(from, to);
				this.counters.commit();
			}
		});
	}


	@cell()
	private get doc(){
		return this.docQuery.result.getModel({
			counters: CRDT.list(CRDT.counter),
		})
	}

	@cell()
	private get room(){
		return this.docQuery.result.room;
	}

	@cell()
	public get counters(){
		return this.doc.counters;
	}

	@bind()
	public add(){
		this.counters.push();
	}

	@bind()
	deleteLast(){
		this.counters.delete(this.counters.length - 1, 1);
		this.counters.commit();
	}

	get isActive(){
		return this.room.peers.size > 0;
	}

}