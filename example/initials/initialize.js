const domain = require('../../lib');

const boxOfficeTypes = require('./boxOfficeTypes');
const distributions = require('./distributions');
const movies = require('./movies');
const places = require('./places');
const priceSpecifications = require('./priceSpecifications');
const subjects = require('./subjects');
const ticketTypeGroups = require('./ticketTypeGroups');
const ticketTypes = require('./ticketTypes');

async function main() {
    await domain.mongoose.connect(process.env.MONGOLAB_URI);

    const actionRepo = new domain.repository.Action(domain.mongoose.connection);
    const boxOfficeTypeRepo = new domain.repository.BoxOfficeType(domain.mongoose.connection);
    const creativeWorkRepo = new domain.repository.CreativeWork(domain.mongoose.connection);
    const distributionRepo = new domain.repository.Distributions(domain.mongoose.connection);
    const eventRepo = new domain.repository.Event(domain.mongoose.connection);
    const placeRepo = new domain.repository.Place(domain.mongoose.connection);
    const priceSpecificationRepo = new domain.repository.PriceSpecification(domain.mongoose.connection);
    const reservationRepo = new domain.repository.Reservation(domain.mongoose.connection);
    const subjectRepo = new domain.repository.Subject(domain.mongoose.connection);
    const ticketTypeRepo = new domain.repository.TicketType(domain.mongoose.connection);
    const taskRepo = new domain.repository.Task(domain.mongoose.connection);
    const transactionRepo = new domain.repository.Transaction(domain.mongoose.connection);

    await actionRepo.actionModel.deleteMany({}).exec();
    await reservationRepo.reservationModel.deleteMany({}).exec();
    await taskRepo.taskModel.deleteMany({}).exec();
    await transactionRepo.transactionModel.deleteMany({}).exec();

    await eventRepo.eventModel.deleteMany({}).exec();
    await creativeWorkRepo.creativeWorkModel.deleteMany({}).exec();
    await placeRepo.placeModel.deleteMany({}).exec();
    await distributionRepo.distributionsModel.deleteMany({}).exec();
    await ticketTypeRepo.ticketTypeGroupModel.deleteMany({}).exec();
    await ticketTypeRepo.ticketTypeModel.deleteMany({}).exec();
    await boxOfficeTypeRepo.boxOfficeTypeModel.deleteMany({}).exec();
    await subjectRepo.subjectModel.deleteMany({}).exec();
    await priceSpecificationRepo.priceSpecificationModel.deleteMany({}).exec();

    await Promise.all(places.map(async (place) => {
        await placeRepo.saveMovieTheater(place);
    }));
    await Promise.all(priceSpecifications.map(async (priceSpecification) => {
        await priceSpecificationRepo.priceSpecificationModel.create(priceSpecification);
    }));
    await Promise.all(boxOfficeTypes.map(async (boxOfficeType) => {
        await boxOfficeTypeRepo.createBoxOfficeType(boxOfficeType);
    }));
    await Promise.all(subjects.map(async (subject) => {
        await subjectRepo.save({ attributes: subject });
    }));
    await Promise.all(ticketTypes.map(async (ticketType) => {
        await ticketTypeRepo.createTicketType(ticketType);
    }));
    await Promise.all(ticketTypeGroups.map(async (ticketTypeGroup) => {
        await ticketTypeRepo.createTicketTypeGroup(ticketTypeGroup);
    }));
    await Promise.all(distributions.map(async (distribution) => {
        await distributionRepo.createDistribution(distribution);
    }));
    await Promise.all(movies.map(async (movie) => {
        await creativeWorkRepo.saveMovie(movie);
    }));

    await domain.mongoose.disconnect();
}

main().then(console.log).catch(console.error);
