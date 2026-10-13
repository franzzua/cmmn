// Decorator metadata (context.metadata) is only created when Symbol.metadata exists,
// which runtimes don't ship yet. Must run before any decorated class is defined.
(Symbol as { metadata?: symbol }).metadata ??= Symbol.for('Symbol.metadata');
