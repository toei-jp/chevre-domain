import { Connection } from 'mongoose';

import * as factory from '../factory';
import TicketTypeModel from './mongoose/model/ticketType';
import TicketTypeGroupModel from './mongoose/model/ticketTypeGroup';

/**
 * Mongoリポジトリー
 */
export class MongoRepository {
    public readonly ticketTypeModel: typeof TicketTypeModel;
    public readonly ticketTypeGroupModel: typeof TicketTypeGroupModel;
    constructor(connection: Connection) {
        this.ticketTypeModel = connection.model(TicketTypeModel.modelName);
        this.ticketTypeGroupModel = connection.model(TicketTypeGroupModel.modelName);
    }
    public static CREATE_TICKET_TYPE_MONGO_CONDITIONS(params: factory.ticketType.ITicketTypeSearchConditions) {
        // MongoDB検索条件
        const andConditions: any[] = [
            {
                _id: { $exists: true }
            }
        ];
        if (params.id !== undefined && params.id !== '') {
            // andConditions.push({ _id: new RegExp(params.id, 'i') });
            if (params.id.length > 0) {
                andConditions.push({
                    _id: {
                        $in: params.id
                    }
                });
            }
        }
        if (params.name !== undefined) {
            andConditions.push({
                $or: [
                    { 'name.ja': new RegExp(params.name, 'i') },
                    { 'name.en': new RegExp(params.name, 'i') }
                ]
            });
        }
        if (params.price !== undefined) {
            andConditions.push({
                price: { $lte: params.price }
            });
        }
        // idHasChoose
        if (params.idHasChoose !== undefined && params.idHasChoose !== '') {
            if (params.idHasChoose.length > 0) {
                andConditions.push({
                    _id: {
                        $not: {
                            $in: params.idHasChoose
                        }
                    }
                });
            }
        }

        return andConditions;
    }
    public static CREATE_TICKET_TYPE_GROUP_MONGO_CONDITIONS(params: factory.ticketType.ITicketTypeGroupSearchConditions) {
        // MongoDB検索条件
        const andConditions: any[] = [
            {
                _id: { $exists: true }
            }
        ];
        if (params.id !== undefined) {
            andConditions.push({ _id: new RegExp(params.id, 'i') });
        }
        if (params.name !== undefined) {
            andConditions.push({
                $or: [
                    { 'name.ja': new RegExp(params.name, 'i') },
                    { 'name.en': new RegExp(params.name, 'i') }
                ]
            });
        }

        return andConditions;
    }
    public async findByTicketGroupId(params: { ticketGroupId: string }): Promise<factory.ticketType.ITicketType[]> {
        const ticketTypeGroup = await this.ticketTypeGroupModel.findById(
            params.ticketGroupId,
            {
                __v: 0,
                createdAt: 0,
                updatedAt: 0
            }
        ).exec()
            .then((doc) => {
                if (doc === null) {
                    throw new factory.errors.NotFound('Ticket type group');
                }

                return <factory.ticketType.ITicketTypeGroup>doc.toObject();
            });

        return this.ticketTypeModel.find({ _id: { $in: ticketTypeGroup.ticketTypes } }).exec()
            .then((docs) => docs.map((doc) => <factory.ticketType.ITicketType>doc.toObject()));
    }
    /**
     * 券種グループを作成する
     */
    public async createTicketTypeGroup(params: factory.ticketType.ITicketTypeGroup): Promise<factory.ticketType.ITicketTypeGroup> {
        const doc = await this.ticketTypeGroupModel.create({ ...params, _id: params.id });

        return doc.toObject();
    }
    /**
     * IDで件券種グループを検索する
     */
    public async findTicketTypeGroupById(params: {
        id: string;
    }): Promise<factory.ticketType.ITicketTypeGroup> {
        const doc = await this.ticketTypeGroupModel.findOne(
            {
                _id: params.id
            },
            {
                __v: 0,
                createdAt: 0,
                updatedAt: 0
            }
        ).exec();
        if (doc === null) {
            throw new factory.errors.NotFound('Ticket type group');
        }

        return doc.toObject();
    }
    public async countTicketTypeGroups(
        params: factory.ticketType.ITicketTypeGroupSearchConditions
    ): Promise<number> {
        const conditions = MongoRepository.CREATE_TICKET_TYPE_GROUP_MONGO_CONDITIONS(params);

        return this.ticketTypeGroupModel.countDocuments(
            { $and: conditions }
        ).setOptions({ maxTimeMS: 10000 })
            .exec();
    }
    /**
     * 券種グループを検索する
     */
    public async searchTicketTypeGroups(
        params: factory.ticketType.ITicketTypeGroupSearchConditions
    ): Promise<factory.ticketType.ITicketTypeGroup[]> {
        const conditions = MongoRepository.CREATE_TICKET_TYPE_GROUP_MONGO_CONDITIONS(params);
        const query = this.ticketTypeGroupModel.find(
            { $and: conditions },
            {
                __v: 0,
                createdAt: 0,
                updatedAt: 0
            }
        );
        if (params.limit !== undefined && params.page !== undefined) {
            query.limit(params.limit).skip(params.limit * (params.page - 1));
        }

        return query.sort({ _id: 1 })
            .setOptions({ maxTimeMS: 10000 })
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
    }
    /**
     * 券種グループを更新する
     */
    public async updateTicketTypeGroup(params: factory.ticketType.ITicketTypeGroup): Promise<void> {
        const doc = await this.ticketTypeGroupModel.findOneAndUpdate(
            {
                _id: params.id
            },
            params,
            { upsert: false, new: true }
        ).exec();
        if (doc === null) {
            throw new factory.errors.NotFound('Ticket type group');
        }
    }
    /**
     * 券種グループを削除する
     */
    public async deleteTicketTypeGroup(params: {
        id: string;
    }) {
        await this.ticketTypeGroupModel.findOneAndRemove(
            {
                _id: params.id
            }
        ).exec();
    }
    /**
     * 券種を作成する
     */
    public async createTicketType(params: factory.ticketType.ITicketType): Promise<factory.ticketType.ITicketType> {
        const doc = await this.ticketTypeModel.create({ ...params, _id: params.id });

        return doc.toObject();
    }
    /**
     * IDで件券種を検索する
     */
    public async findTicketTypeById(params: {
        id: string;
    }): Promise<factory.ticketType.ITicketType> {
        const doc = await this.ticketTypeModel.findOne(
            {
                _id: params.id
            },
            {
                __v: 0,
                createdAt: 0,
                updatedAt: 0
            }
        ).exec();
        if (doc === null) {
            throw new factory.errors.NotFound('Ticket type group');
        }

        return doc.toObject();
    }
    public async countTicketTypes(
        params: factory.ticketType.ITicketTypeSearchConditions
    ): Promise<number> {
        const conditions = MongoRepository.CREATE_TICKET_TYPE_MONGO_CONDITIONS(params);

        return this.ticketTypeModel.countDocuments(
            { $and: conditions }
        ).setOptions({ maxTimeMS: 10000 })
            .exec();
    }
    /**
     * 券種を検索する
     */
    public async searchTicketTypes(
        params: factory.ticketType.ITicketTypeSearchConditions
    ): Promise<factory.ticketType.ITicketType[]> {
        const conditions = MongoRepository.CREATE_TICKET_TYPE_MONGO_CONDITIONS(params);
        const query = this.ticketTypeModel.find(
            { $and: conditions },
            {
                __v: 0,
                createdAt: 0,
                updatedAt: 0
            }
        );
        if (params.limit !== undefined && params.page !== undefined) {
            query.limit(params.limit).skip(params.limit * (params.page - 1));
        }

        return query.sort({ _id: 1 })
            .setOptions({ maxTimeMS: 10000 })
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
    }
    /**
     * 券種を更新する
     */
    public async updateTicketType(params: factory.ticketType.ITicketType): Promise<void> {
        const doc = await this.ticketTypeModel.findOneAndUpdate(
            {
                _id: params.id
            },
            params,
            { upsert: false, new: true }
        ).exec();
        if (doc === null) {
            throw new factory.errors.NotFound('Ticket type');
        }
    }
    /**
     * 券種を削除する
     */
    public async deleteTicketType(params: {
        id: string;
    }) {
        await this.ticketTypeModel.findOneAndRemove(
            {
                _id: params.id
            }
        ).exec();
    }

    /**
     * 関連券種グループリスト
     */
    public async findTicketTypeGroupByTicketTypeId(params: {
        ticketTypeId: string;
    }): Promise<factory.ticketType.ITicketType[]> {
        const query = this.ticketTypeGroupModel.find(
            {
                ticketTypes: {
                    $in: [params.ticketTypeId]
                }
            },
            {
                __v: 0,
                createdAt: 0,
                updatedAt: 0
            }
        );

        return query.sort({ _id: 1 })
            .setOptions({ maxTimeMS: 10000 })
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
    }
}
