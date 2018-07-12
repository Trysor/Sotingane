import { trigger, animate, style, group, animateChild, query, stagger, transition, sequence } from '@angular/animations';

export const RoutingAnim = trigger('RoutingAnim', [
    transition('* <=> *', [
        group([
            query(
                ':leave',
                [animate('0.35s', style({ opacity: 0 })), animateChild()],
                { optional: true }
            ),
            query(
                ':enter',
                [
                    style({
                        opacity: 0,
                        transform: 'translateY(-10%)'
                    }),
                    animate(
                        '0.35s ease-in-out',
                        style({ opacity: 1, transform: 'translateY(0)' })
                    ),
                    animateChild()
                ],
                { optional: true }
            ),

        ])
    ])
]);
