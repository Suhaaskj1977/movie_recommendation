# from flask import Flask, request, jsonify
# import pandas as pd
# import numpy as np
# from sklearn.preprocessing import MinMaxScaler
# from sklearn.neighbors import NearestNeighbors
# from sklearn.impute import SimpleImputer
# import sys
# import json
# import traceback
# import logging


# # Configure logging
# logging.basicConfig(level=logging.DEBUG)


# app = Flask(__name__)

# # Load and preprocess data (this should match your previous preprocessing logic)
# movie = pd.read_csv('/Users/vishnuadithya/Downloads/indian movies.csv')

# def preprocess_data(movie):
#     # Strip leading/trailing spaces from string columns
#     movie['Movie Name'] = movie['Movie Name'].str.strip()
#     movie['Language'] = movie['Language'].str.strip()

#     # Convert 'Year' to numeric and calculate movie age
#     current_year = 2024
#     movie['Year'] = pd.to_numeric(movie['Year'], errors='coerce')
#     movie['Movie_Age'] = current_year - movie['Year']

#     # Clean and convert numeric columns
#     numeric_columns = ['Timing', 'Rating(10)', 'Votes', 'Movie_Age']
#     for col in numeric_columns:
#         movie[col] = pd.to_numeric(movie[col].replace(['-', 'unknown'], np.nan), errors='coerce')
   
#     # Impute missing values
#     imputer = SimpleImputer(strategy='median')
#     movie[numeric_columns] = imputer.fit_transform(movie[numeric_columns])

#     # Normalize numeric columns
#     scaler = MinMaxScaler()
#     movie[numeric_columns] = scaler.fit_transform(movie[numeric_columns])

#     # One-hot encoding for 'Language'
#     movie['Language'] = movie['Language'].fillna('Unknown')
#     language_dummies = pd.get_dummies(movie['Language'], prefix='Lang')
#     movie = pd.concat([movie, language_dummies], axis=1)

#     # Process 'Genre'
#     movie['Genre'] = movie['Genre'].fillna('')
#     movie['Genre'] = movie['Genre'].apply(lambda x: [genre.strip() for genre in str(x).split(',')] if pd.notna(x) else [])
#     genres_list = sorted(set(genre for genres in movie['Genre'] for genre in genres if genre))
#     for genre in genres_list:
#         movie[f'Genre_{genre}'] = movie['Genre'].apply(lambda x: int(genre in x))

#     # Select features for recommendation
#     feature_columns = numeric_columns + list(language_dummies.columns) + [f'Genre_{genre}' for genre in genres_list]
    
#     # Final check for NaN values
#     movie_features = movie[feature_columns]
#     if movie_features.isnull().values.any():
#         print("Warning: NaN values still present in the following columns:")
#         print(movie_features.columns[movie_features.isnull().any()].tolist())
#         print("Filling remaining NaN values with 0")
#         movie_features = movie_features.fillna(0)
    
#     return movie, feature_columns, movie_features
# def recommend_movies(movie_df, movie_features, knn_model, movie_name, movie_language, year_gap=None, k=5):
#     # Strip leading/trailing spaces from input
#     movie_name = movie_name.strip()
#     movie_language = movie_language.strip()
    
#     # Filter movies by name and language
#     filtered_movies = movie_df[(movie_df['Movie Name'].str.lower() == movie_name.lower()) &
#                                (movie_df['Language'].str.lower() == movie_language.lower())]
    
#     if filtered_movies.empty:
#         return "Movie not found"
    
#     movie_index = filtered_movies.index[0]
#     movie_vector = movie_features.iloc[movie_index].values.reshape(1, -1)
    
#     if year_gap:
#         min_gap, max_gap = map(int, year_gap.split('-'))
#         movie_year = movie_df.loc[movie_index, 'Year']
#         year_filter = (movie_df['Year'] >= movie_year + min_gap) & (movie_df['Year'] <= movie_year + max_gap)
        
#         # Get more neighbors initially to account for year filtering
#         n_neighbors = min(len(movie_df) - 1, k * 10)  # Increased multiplier
#         distances, indices = knn_model.kneighbors(movie_vector, n_neighbors=n_neighbors + 1)
        
#         # Create a DataFrame with distances and apply year filter
#         similar_movies = pd.DataFrame({
#             'index': indices.flatten()[1:],
#             'distance': distances.flatten()[1:]
#         })
#         similar_movies = similar_movies[year_filter.iloc[similar_movies['index']].values]
        
#         # If we still don't have enough recommendations, get more neighbors
#         while len(similar_movies) < k and n_neighbors < len(movie_df) - 1:
#             n_neighbors = min(len(movie_df) - 1, n_neighbors * 2)
#             distances, indices = knn_model.kneighbors(movie_vector, n_neighbors=n_neighbors + 1)
#             new_similar = pd.DataFrame({
#                 'index': indices.flatten()[1:],
#                 'distance': distances.flatten()[1:]
#             })
#             new_similar = new_similar[year_filter.iloc[new_similar['index']].values]
#             similar_movies = pd.concat([similar_movies, new_similar]).drop_duplicates(subset='index')
        
#         # Sort by distance and select top k
#         similar_movies = similar_movies.sort_values('distance').head(k)
#         recommended_indices = similar_movies['index'].values
#     else:
#         # If no year gap, just get k neighbors
#         distances, indices = knn_model.kneighbors(movie_vector, n_neighbors=k+1)
#         recommended_indices = indices.flatten()[1:]
    
#     return movie_df.loc[recommended_indices, 'Movie Name'].values

# movie, feature_columns, movie_features = preprocess_data(movie)
# knn = NearestNeighbors(n_neighbors=6, metric='euclidean')
# knn.fit(movie_features)
# @app.route('/recommend', methods=['POST'])
# def recommend():
#     data = request.get_json()
#     movie_name = data.get('movie_name')
#     movie_language = data.get('movie_language')
#     year_gap = data.get('year_gap')
#     k = data.get('k', 5)

#     try:
#         recommendations = recommend_movies(movie, movie_features, knn, movie_name, movie_language, year_gap, k)
#         return jsonify(recommendations)
#     except Exception as e:
#         logging.error(f"Error in recommendation endpoint: {e}", exc_info=True)
#         return jsonify({'error': 'An error occurred while processing the recommendation'}), 500

# if __name__ == '__main__':
#     logging.basicConfig(level=logging.DEBUG)
#     app.run(port=5001, debug=True)
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
import sys
import json
import traceback
import logging
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.neighbors import NearestNeighbors
from sklearn.impute import SimpleImputer

# Configure logging
logging.basicConfig(level=logging.DEBUG, filename='recommendation_service.log', filemode='w',
                    format='%(asctime)s - %(levelname)s - %(message)s')

# Load and preprocess data
try:
    movie = pd.read_csv('/Users/vishnuadithya/Downloads/indian movies.csv')
    logging.info("Successfully loaded movie data")
except Exception as e:
    logging.error(f"Error loading movie data: {str(e)}")
    sys.exit(1)

def preprocess_data(movie):
    try:
         # Strip leading/trailing spaces from string columns
        movie['Movie Name'] = movie['Movie Name'].str.strip()
        movie['Language'] = movie['Language'].str.strip()

        # Convert 'Year' to numeric and calculate movie age
        current_year = 2024
        movie['Year'] = pd.to_numeric(movie['Year'], errors='coerce')
        movie['Movie_Age'] = current_year - movie['Year']

        # Clean and convert numeric columns
        numeric_columns = ['Timing', 'Rating(10)', 'Votes', 'Movie_Age']
        for col in numeric_columns:
            movie[col] = pd.to_numeric(movie[col].replace(['-', 'unknown'], np.nan), errors='coerce')
    
        # Impute missing values
        imputer = SimpleImputer(strategy='median')
        movie[numeric_columns] = imputer.fit_transform(movie[numeric_columns])

        # Normalize numeric columns
        scaler = MinMaxScaler()
        movie[numeric_columns] = scaler.fit_transform(movie[numeric_columns])

        # One-hot encoding for 'Language'
        movie['Language'] = movie['Language'].fillna('Unknown')
        language_dummies = pd.get_dummies(movie['Language'], prefix='Lang')
        movie = pd.concat([movie, language_dummies], axis=1)

        # Process 'Genre'
        movie['Genre'] = movie['Genre'].fillna('')
        movie['Genre'] = movie['Genre'].apply(lambda x: [genre.strip() for genre in str(x).split(',')] if pd.notna(x) else [])
        genres_list = sorted(set(genre for genres in movie['Genre'] for genre in genres if genre))
        for genre in genres_list:
            movie[f'Genre_{genre}'] = movie['Genre'].apply(lambda x: int(genre in x))

        # Select features for recommendation
        feature_columns = numeric_columns + list(language_dummies.columns) + [f'Genre_{genre}' for genre in genres_list]
        
        # Final check for NaN values
        movie_features = movie[feature_columns]
        if movie_features.isnull().values.any():
            print("Warning: NaN values still present in the following columns:")
            print(movie_features.columns[movie_features.isnull().any()].tolist())
            print("Filling remaining NaN values with 0")
            movie_features = movie_features.fillna(0)
            
        logging.info("Data preprocessing completed successfully")
        return movie, feature_columns, movie_features
    except Exception as e:
        logging.error(f"Error in data preprocessing: {str(e)}")
        traceback.print_exc()
        sys.exit(1)

def recommend_movies(movie_df, movie_features, knn_model, movie_name, movie_language, year_gap=None, k=5):
    try:
        # Strip leading/trailing spaces from input
        movie_name = movie_name.strip()
        movie_language = movie_language.strip()
        
        # Filter movies by name and language
        filtered_movies = movie_df[(movie_df['Movie Name'].str.lower() == movie_name.lower()) &
                                (movie_df['Language'].str.lower() == movie_language.lower())]
        
        if filtered_movies.empty:
            return "Movie not found"
        
        movie_index = filtered_movies.index[0]
        movie_vector = movie_features.iloc[movie_index].values.reshape(1, -1)
        
        if year_gap:
            min_gap, max_gap = map(int, year_gap.split('-'))
            movie_year = movie_df.loc[movie_index, 'Year']
            year_filter = (movie_df['Year'] >= movie_year + min_gap) & (movie_df['Year'] <= movie_year + max_gap)
            
            # Get more neighbors initially to account for year filtering
            n_neighbors = min(len(movie_df) - 1, k * 10)  # Increased multiplier
            distances, indices = knn_model.kneighbors(movie_vector, n_neighbors=n_neighbors + 1)
            
            # Create a DataFrame with distances and apply year filter
            similar_movies = pd.DataFrame({
                'index': indices.flatten()[1:],
                'distance': distances.flatten()[1:]
            })
            similar_movies = similar_movies[year_filter.iloc[similar_movies['index']].values]
            
            # If we still don't have enough recommendations, get more neighbors
            while len(similar_movies) < k and n_neighbors < len(movie_df) - 1:
                n_neighbors = min(len(movie_df) - 1, n_neighbors * 2)
                distances, indices = knn_model.kneighbors(movie_vector, n_neighbors=n_neighbors + 1)
                new_similar = pd.DataFrame({
                    'index': indices.flatten()[1:],
                    'distance': distances.flatten()[1:]
                })
                new_similar = new_similar[year_filter.iloc[new_similar['index']].values]
                similar_movies = pd.concat([similar_movies, new_similar]).drop_duplicates(subset='index')
            
            # Sort by distance and select top k
            similar_movies = similar_movies.sort_values('distance').head(k)
            recommended_indices = similar_movies['index'].values
        else:
            # If no year gap, just get k neighbors
            distances, indices = knn_model.kneighbors(movie_vector, n_neighbors=k+1)
            recommended_indices = indices.flatten()[1:]

        logging.info(f"Successfully generated recommendations for {movie_name}")
        return movie_df.loc[recommended_indices, 'Movie Name'].values.tolist()
    except Exception as e:
        logging.error(f"Error in movie recommendation: {str(e)}")
        traceback.print_exc()
        return []

# Preprocess data and create KNN model
movie, feature_columns, movie_features = preprocess_data(movie)
knn = NearestNeighbors(n_neighbors=6, metric='euclidean')
knn.fit(movie_features)

if __name__ == '__main__':
    try:
        movie_name = sys.argv[1]
        movie_language = sys.argv[2]
        year_gap = sys.argv[3] if len(sys.argv) > 3 else None
        k = int(sys.argv[4]) if len(sys.argv) > 4 else 5

        recommendations = recommend_movies(movie, movie_features, knn, movie_name, movie_language, year_gap, k)
        print(json.dumps(recommendations))
    except Exception as e:
        logging.error(f"Error in main execution: {str(e)}")
        traceback.print_exc()
        print(json.dumps({"error": str(e)}))