const Service = require("../models/Service");

//creating a new service (only admin)
exports.createService = async (req, res) => {
  const { name, description, price, duration } = req.body;

  const serviceExists = await Service.findOne({ name });
  if (serviceExists) {
    return res.status(400).json({ message: "Service already exists." });
  }

  const service = await Service.create({
    name,
    description,
    price,
    duration,
  });

  res.status(201).json(service);
  try {
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get all the services
exports.getServices = async (req, res) => {
  const services = await Service.find({});
  res.json(services);
};

//edit a service (only admin)
exports.updateService = async (req, res) => {
  const { name, description, price, duration } = req.body;

  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    service.name = name || service.name;
    service.description = description || service.description;
    service.price = price || service.price;
    service.duration = duration || service.duration;

    const updatedService = await service.save();
    res.json(updatedService);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//delete a service (only admin)
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    await service.deleteOne();
    res.json({ message: "Service removed." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
