import { ForwardRefRenderFunction, useMemo } from 'react';
import { Cell } from '@cmmn/core';
import {useCell} from "./useCell";

export function celled<T, P>(
	component: ForwardRefRenderFunction<T, P>,
	options: {} = {},
) {
	return (props, context) => {
		const cell = useMemo(() => new Cell(() => component(props, context)), []);
		return useCell(cell);
	};
}