import { mvtk } from '@movieticket/reserve-api-abstract-client';

import { MongoRepository as EventRepo } from '../repo/event';
import { MongoRepository as PriceSpecificationRepo } from '../repo/priceSpecification';
import { MongoRepository as TicketTypeRepo } from '../repo/ticketType';

import * as factory from '../factory';

type IUnitPriceSpecification =
    factory.priceSpecification.IPriceSpecification<factory.priceSpecificationType.UnitPriceSpecification>;
type IMovieTicketTypeChargeSpecification =
    factory.priceSpecification.IPriceSpecification<factory.priceSpecificationType.MovieTicketTypeChargeSpecification>;
type ISoundFormatChargeSpecification =
    factory.priceSpecification.IPriceSpecification<factory.priceSpecificationType.SoundFormatChargeSpecification>;
type IVideoFormatChargeSpecification =
    factory.priceSpecification.IPriceSpecification<factory.priceSpecificationType.VideoFormatChargeSpecification>;
type ISearchScreeningEventTicketOffersOperation<T> = (repos: {
    event: EventRepo;
    priceSpecification: PriceSpecificationRepo;
    ticketType: TicketTypeRepo;
}) => Promise<T>;
/**
 * 上映イベントに対する券種オファーを検索する
 */
export function searchScreeningEventTicketOffers(params: {
    eventId: string;
}): ISearchScreeningEventTicketOffersOperation<factory.event.screeningEvent.ITicketOffer[]> {
    // tslint:disable-next-line:max-func-body-length
    return async (repos: {
        event: EventRepo;
        priceSpecification: PriceSpecificationRepo;
        ticketType: TicketTypeRepo;
    }) => {
        const event = await repos.event.findById({
            typeOf: factory.eventType.ScreeningEvent,
            id: params.eventId
        });
        const eventSoundFormatTypes
            = (Array.isArray(event.superEvent.soundFormat)) ? event.superEvent.soundFormat.map((f) => f.typeOf) : [];
        const eventVideoFormatTypes
            = (Array.isArray(event.superEvent.videoFormat)) ? event.superEvent.videoFormat.map((f) => f.typeOf) : [];
        const ticketTypes = await repos.ticketType.findByTicketGroupId({ ticketGroupId: event.ticketTypeGroup });

        // 価格仕様を検索する
        const soundFormatCompoundPriceSpecifications = await repos.priceSpecification.searchCompoundPriceSpecifications({
            typeOf: factory.priceSpecificationType.CompoundPriceSpecification,
            priceComponent: { typeOf: factory.priceSpecificationType.SoundFormatChargeSpecification }
        });
        const videoFormatCompoundPriceSpecifications = await repos.priceSpecification.searchCompoundPriceSpecifications({
            typeOf: factory.priceSpecificationType.CompoundPriceSpecification,
            priceComponent: { typeOf: factory.priceSpecificationType.VideoFormatChargeSpecification }
        });
        const movieTicketTypeCompoundPriceSpecifications = await repos.priceSpecification.searchCompoundPriceSpecifications({
            typeOf: factory.priceSpecificationType.CompoundPriceSpecification,
            priceComponent: { typeOf: factory.priceSpecificationType.MovieTicketTypeChargeSpecification }
        });
        const soundFormatChargeSpecifications =
            soundFormatCompoundPriceSpecifications.reduce<ISoundFormatChargeSpecification[]>(
                (a, b) => [...a, ...b.priceComponent],
                []
            ).filter((specification) => eventSoundFormatTypes.indexOf(specification.appliesToSoundFormat) >= 0);
        const videoFormatChargeSpecifications =
            videoFormatCompoundPriceSpecifications.reduce<IVideoFormatChargeSpecification[]>(
                (a, b) => [...a, ...b.priceComponent],
                []
            ).filter((specification) => eventVideoFormatTypes.indexOf(specification.appliesToVideoFormat) >= 0);
        const movieTicketTypeChargeSpecifications =
            movieTicketTypeCompoundPriceSpecifications.reduce<IMovieTicketTypeChargeSpecification[]>(
                (a, b) => [...a, ...b.priceComponent],
                []
            );
        const movieTicketTypeCodes = Array.from(new Set(
            movieTicketTypeChargeSpecifications.map((specification) => specification.appliesToMovieTicketType)
        ));
        const movieTicketOffers = movieTicketTypeCodes.map((movieTicketTypeCode) => {
            const movieTicketType = mvtk.util.constants.TICKET_TYPE.find((ticketType) => ticketType.code === movieTicketTypeCode);
            const unitPriceSpecification: IUnitPriceSpecification = {
                typeOf: factory.priceSpecificationType.UnitPriceSpecification,
                price: 0,
                priceCurrency: factory.priceCurrency.JPY,
                name: {
                    ja: `ムビチケ ${(movieTicketType !== undefined) ? movieTicketType.name : ''}`,
                    en: 'Movie Ticket',
                    kr: 'Movie Ticket'
                },
                description: {
                    ja: `ムビチケ ${(movieTicketType !== undefined) ? movieTicketType.name : ''}`,
                    en: 'Movie Ticket',
                    kr: 'Movie Ticket'
                },
                valueAddedTaxIncluded: true,
                referenceQuantity: {
                    typeOf: 'QuantitativeValue',
                    unitCode: factory.unitCode.C62,
                    value: 1
                }
            };
            const mvtkSpecifications = movieTicketTypeChargeSpecifications.filter(
                (s) => s.appliesToMovieTicketType === movieTicketTypeCode
            );
            const compoundPriceSpecification: factory.event.screeningEvent.ITicketPriceSpecification = {
                typeOf: factory.priceSpecificationType.CompoundPriceSpecification,
                priceCurrency: factory.priceCurrency.JPY,
                valueAddedTaxIncluded: true,
                priceComponent: [unitPriceSpecification, ...mvtkSpecifications]
            };

            return {
                typeOf: <factory.offerType>'Offer',
                id: `offer-by-movieticket-${movieTicketTypeCode}`,
                name: {
                    ja: `ムビチケ ${(movieTicketType !== undefined) ? movieTicketType.name : ''}`,
                    en: 'Movie Ticket',
                    kr: 'Movie Ticket'
                },
                description: {
                    ja: `ムビチケ ${(movieTicketType !== undefined) ? movieTicketType.name : ''}`,
                    en: 'Movie Ticket',
                    kr: 'Movie Ticket'
                },
                valueAddedTaxIncluded: true,
                priceCurrency: factory.priceCurrency.JPY,
                priceSpecification: compoundPriceSpecification
            };
        });

        const offers = ticketTypes.map((ticketType) => {
            // イベントに関係のある価格仕様に絞り、ひとつの複合価格仕様としてまとめる
            const unitPriceSpecification: IUnitPriceSpecification = {
                typeOf: factory.priceSpecificationType.UnitPriceSpecification,
                price: ticketType.price,
                priceCurrency: factory.priceCurrency.JPY,
                name: ticketType.name,
                description: ticketType.description,
                valueAddedTaxIncluded: true,
                referenceQuantity: {
                    typeOf: 'QuantitativeValue',
                    unitCode: factory.unitCode.C62,
                    value: 1
                }
            };
            const compoundPriceSpecification: factory.event.screeningEvent.ITicketPriceSpecification = {
                typeOf: factory.priceSpecificationType.CompoundPriceSpecification,
                priceCurrency: factory.priceCurrency.JPY,
                valueAddedTaxIncluded: true,
                priceComponent: [
                    unitPriceSpecification,
                    ...videoFormatChargeSpecifications,
                    ...soundFormatChargeSpecifications
                ]
            };

            return {
                typeOf: <factory.offerType>'Offer',
                id: ticketType.id,
                name: ticketType.name,
                description: ticketType.description,
                priceCurrency: factory.priceCurrency.JPY,
                priceSpecification: compoundPriceSpecification,
                isOnlineTicket: ticketType.isOnlineTicket,
                isBoxTicket: ticketType.isBoxTicket
            };
        });

        return [...offers, ...movieTicketOffers];
    };
}
