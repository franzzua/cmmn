import {css} from "@acab/ecsstatic";
import {PointerEvent, useCallback, useRef, useState} from "react";


const styles = {
	wrapper: css`
        position: absolute;
        left: 0;
        top: 0;
	`,
	movable: css`
        background: red;
        width: 5em;
        height: 5em;
        will-change: transform;
	`,
	move: css`
        cursor: move;
	`
}

export function Movable(){
	const wrapperRef = useRef<HTMLDivElement>(null);
	const divRef = useRef<HTMLDivElement>(null);
	const totalShiftRef = useRef({x: 0, y: 0});
	const [isMoving, setIsMoving] = useState(false);
	const [transform, setTransform] = useState('');
	const onDown = useCallback((down: PointerEvent<HTMLDivElement>) => {
		const abort = new AbortController();
		divRef.current.addEventListener('pointermove', e => {
			divRef.current.setPointerCapture(down.pointerId);
			const shift = diff(e as PointerEvent, down);
			setTransform(`translate(${shift.x}px, ${shift.y}px)`);
		}, { signal: abort.signal });
		divRef.current.addEventListener('pointerup', up => {
			setTransform(``);
			totalShiftRef.current = sum(totalShiftRef.current, diff(up as PointerEvent, down));
			wrapperRef.current.style.left = totalShiftRef.current.x + 'px';
			wrapperRef.current.style.top = totalShiftRef.current.y + 'px';
			abort.abort();
		}, { once: true })
	}, []);
	return <div ref={wrapperRef} className={styles.wrapper}>
		<div ref={divRef} className={[styles.movable, isMoving ? styles.move: ''].join(' ')}
		     onPointerDown={onDown}
		     style={{ transform }}/>
	</div>;
}
function diff(x: PointerEvent, y: PointerEvent){
	return { x: x.pageX - y.pageX, y: x.pageY - y.pageY };
}
function sum<T extends Pick<PointerEvent, 'x' | 'y'>>(x: T, y: T){
	return { x: x.x + y.x, y: x.y + y.y };
}