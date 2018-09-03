import * as factory from '@toei-jp/chevre-factory';
import { Connection } from 'mongoose';
import placeModel from './mongoose/model/place';

/**
 * 場所抽象リポジトリー
 */
export abstract class Repository {
    public abstract async saveMovieTheater(movieTheater: factory.place.movieTheater.IPlace): Promise<void>;
    public abstract async searchMovieTheaters(searchConditions: {}): Promise<factory.place.movieTheater.IPlaceWithoutScreeningRoom[]>;
    public abstract async findMovieTheaterByBranchCode(branchCode: string): Promise<factory.place.movieTheater.IPlace>;
}

/**
 * 場所リポジトリー
 */
export class MongoRepository {
    public readonly placeModel: typeof placeModel;
    constructor(connection: Connection) {
        this.placeModel = connection.model(placeModel.modelName);
    }
    public static CREATE_MOVIE_THEATER_MONGO_CONDITIONS(params: factory.place.movieTheater.ISearchConditions) {
        // MongoDB検索条件
        const andConditions: any[] = [
            {
                typeOf: factory.placeType.MovieTheater
            }
        ];
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.name !== undefined) {
            andConditions.push({
                $or: [
                    { 'name.ja': new RegExp(params.name, 'i') },
                    { 'name.en': new RegExp(params.name, 'i') },
                    { kanaName: new RegExp(params.name, 'i') }
                ]
            });
        }

        return andConditions;
    }
    /**
     * 劇場を保管する
     */
    public async saveMovieTheater(movieTheater: factory.place.movieTheater.IPlace) {
        await this.placeModel.findOneAndUpdate(
            {
                typeOf: factory.placeType.MovieTheater,
                branchCode: movieTheater.branchCode
            },
            movieTheater,
            { upsert: true }
        ).exec();
    }
    public async countMovieTheaters(params: factory.place.movieTheater.ISearchConditions): Promise<number> {
        const conditions = MongoRepository.CREATE_MOVIE_THEATER_MONGO_CONDITIONS(params);

        return this.placeModel.countDocuments(
            { $and: conditions }
        ).setOptions({ maxTimeMS: 10000 })
            .exec();
    }
    /**
     * 劇場検索
     */
    public async searchMovieTheaters(
        params: factory.place.movieTheater.ISearchConditions
    ): Promise<factory.place.movieTheater.IPlaceWithoutScreeningRoom[]> {
        const conditions = MongoRepository.CREATE_MOVIE_THEATER_MONGO_CONDITIONS(params);
        // containsPlaceを含めるとデータサイズが大きくなるので、検索結果には含めない
        const query = this.placeModel.find(
            { $and: conditions },
            {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
                containsPlace: 0
            }
        );
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.limit !== undefined && params.page !== undefined) {
            query.limit(params.limit).skip(params.limit * (params.page - 1));
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.sort !== undefined) {
            query.sort(params.sort);
        }

        return query.setOptions({ maxTimeMS: 10000 }).exec().then((docs) => docs.map((doc) => doc.toObject()));
    }
    /**
     * 枝番号で劇場検索
     */
    public async findMovieTheaterByBranchCode(
        branchCode: string
    ): Promise<factory.place.movieTheater.IPlace> {
        const doc = await this.placeModel.findOne(
            {
                typeOf: factory.placeType.MovieTheater,
                branchCode: branchCode
            },
            {
                __v: 0,
                createdAt: 0,
                updatedAt: 0
            }
        ).exec();

        if (doc === null) {
            throw new factory.errors.NotFound('movieTheater');
        }

        return <factory.place.movieTheater.IPlace>doc.toObject();
    }
}
