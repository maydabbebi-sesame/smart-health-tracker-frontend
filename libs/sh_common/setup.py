from setuptools import find_packages, setup

setup(
    name="sh_common",
    version="0.1.0",
    description="Shared auth/identifier primitives for SmartHealth services",
    packages=find_packages(),
    install_requires=[
        "Flask",
        "PyJWT",
        "cryptography",
        "mysql-connector-python",
        "python-dotenv",
        "pika",
    ],
)
