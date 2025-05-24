React components:

1. Celled:

```typescript jsx
export const Icon = celled<{ size: number; title: string; }>(props => {
	const service = useInjected(Service);
	
	const onClick = useCallback(
		(e: PointerEvent) => service.onIconClick(props.size),
        [props.size]
    );
	
	return (
		// subscribed on props.size and service.userName changes but not props.title changes
        <svg onClick={onClick}>
			<circle r={props.size}/> 
			<text>{service.userName}</text>
		</svg>
	);
})
```
2. Component
```typescript jsx
@component()
export class Icon extends Component<{ size: number; title: string; }> {
	
	service = resolve(Service);
	
	onClick = (e: PointerEvent) => this.service.onIconClick(this.props.size);
	
    protected render(){
	    // subscribed on props.size and service.userName changes but not props.title changes
		return <svg onClick={this.onClick}>
            <circle r={this.props.size}/>  
            <text>{service.userName}</text>
        </svg>;
    }
}
```


