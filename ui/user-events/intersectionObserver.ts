import {Cell} from "@cmmn/cell";

class IntersectObserver {

  private observer = new IntersectionObserver((entries) => {
    for (let entry of entries) {
      this.ObservationMap.get(entry.target).set(entry);
    }
  }, {
    rootMargin: '0px',
    threshold: .1
  });

  private ObservationMap = new Map<Element, Cell<IntersectionObserverEntry>>();

  public Observe(element: Element) {
    return  this.ObservationMap.getOrAdd(element, element => {
      this.observer.observe(element);
      const record = this.observer.takeRecords().find(x => x.target === element);
      return new Cell<IntersectionObserverEntry>(record);
    }).get();
  }

}
export const intersectionObserver = new IntersectObserver();
